import json
import os

import torch
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponse
from django.views.decorators.csrf import csrf_exempt
import numpy as np

from FLHeteroBackend.settings import USE_GPU, DATA_HOME
from cluster import get_cluster_list
from cpca.cpca_gpu import CPCA_GPU
from gradcam import get_grad_cam_local, get_grad_cam_server
from . import RunningState
from utils import load_history, load_samples, load_outputs, load_weights, get_load_data_size
from cpca import CPCA, pca_weights

rs = RunningState()


def hello(request):
    return JsonResponse('Hello', safe=False)


# path('datasets/', views.datasets),
@csrf_exempt
def datasets(request):
    if request.method == 'GET':
        data = {'datasetNames': list(DATA_HOME.keys())}
        return JsonResponse(data)
    if request.method == 'POST':
        request_data = json.loads(request.body)
        dataset_name = request_data['datasetName']

        history = load_history(dataset_name)
        samples_data = np.load(os.path.join(DATA_HOME[dataset_name], 'samples.npz'), allow_pickle=True)
        client_names = samples_data['client_names']
        n_clients = history['n_clients']
        n_rounds = history['loss'].shape[1]

        rs.set('dataset', dataset_name)
        rs.set('client_names', client_names)
        rs.set('n_clients', n_clients)
        rs.set('n_rounds', n_rounds)
        rs.set('data_shape', samples_data['shape'])
        rs.set('data_type', samples_data['type'])

        data = {'type': str(samples_data['type']),
                'dimensions': samples_data['shape'].tolist(),
                'samplingTypes': samples_data['sampling_types'].tolist(),
                'numberOfClients': n_clients,
                'clientNames': client_names.tolist(),
                'communicationRounds': n_rounds,
                }

        # for (k, v) in data.items():
        #     print('{}: {} {}'.format(k, type(v), np.shape(v)))

        return JsonResponse(data)


# path('client/', views.client),
@csrf_exempt
def client(request):
    if request.method == 'POST':
        request_data = json.loads(request.body)
        client_name = request_data['clientName']

        if client_name not in rs['client_names']:
            return HttpResponseBadRequest

        rs.set('client', client_name)
        rs.set('annotations', [])

        client_idx = np.where(rs['client_names'] == client_name)

        history = load_history(rs['dataset'])
        loss = history['loss'][client_idx][0]
        val_acc = history['val_acc'][client_idx][0]
        tot_acc = history['tot_acc'][client_idx][0]
        train_size, test_size = get_load_data_size(rs['dataset'], client_name)

        data = {
            'loss': loss.tolist(),
            'valAcc': val_acc.tolist(),
            'totAcc': tot_acc.tolist(),
            'trainSize': int(train_size),
            'testSize': int(test_size),
        }
        return JsonResponse(data)


# path('weights/', views.weights),
@csrf_exempt
def weights(request):
    if request.method == 'GET':
        layer_names, weights_0, weights_client, weights_server, cosines = load_weights(dataset_name=rs['dataset'],
                                                                                       client_name=rs['client'],
                                                                                       n_rounds=rs['n_rounds'])

        weights_0, weights_client, weights_server = pca_weights(weights_0, weights_client, weights_server)

        data = {'layerNames': layer_names,
                'weight0': weights_0,
                'serverWeights': weights_server,
                'clientWeights': weights_client,
                'cosines': cosines.tolist(),
                }

        return JsonResponse(data)


# path('sampling/', views.sampling),
@csrf_exempt
def sampling(request):
    if request.method == 'POST':
        request_data = json.loads(request.body)
        sampling_type = request_data['samplingType']

        samples, ground_truth = load_samples(dataset=rs.state['dataset'], client_name=rs.state['client'],
                                             sampling_type=sampling_type)

        rs.set('data', samples)
        rs.set('sampling_type', sampling_type)
        rs.set('ground_truth', ground_truth)

        return JsonResponse({})


# path('labels/', views.labels),
@csrf_exempt
def labels(request):
    if request.method == 'POST':
        request_data = json.loads(request.body)
        cm_round = request_data['round']

        output_labels = load_outputs(datasets=rs['dataset'], client_name=rs['client'],
                                     sampling_type=rs['sampling_type'], cm_round=cm_round)
        rs.add_dict(output_labels)
        rs.set('cm_round', cm_round)

        outputs_server = rs.state['outputs_server']  # type: np.ndarray
        outputs_client = rs.state['outputs_client']  # type: np.ndarray
        ground_truth = rs.state['ground_truth']

        data = {'consistencyLabel': (outputs_client == outputs_server).tolist(),
                'groundTruthLabel': ground_truth.tolist(),
                'outputLabel': outputs_server.tolist(),
                'localOutputLabel': outputs_client.tolist(),
                }
        return JsonResponse(data)


# path('cpca/all', views.cpca_all),
@csrf_exempt
def cpca_all(request):
    if request.method == 'POST':
        request_data = json.loads(request.body)
        alpha = None
        if 'alpha' in request_data.keys():
            alpha = request_data['alpha']

        data = rs.state['data']
        hetero_labels = rs.state['outputs_server'] != rs.state['outputs_client']

        if USE_GPU:
            with torch.no_grad():
                cPCA = CPCA_GPU(n_components=2)
                projected_data = cPCA.fit_transform(target=data, background=data[hetero_labels], alpha=alpha)
                components = cPCA.get_components()
                alpha = cPCA.get_alpha()
        else:
            cPCA = CPCA(n_components=2)
            projected_data = cPCA.fit_transform(target=data, background=data[hetero_labels], alpha=alpha)
            components = cPCA.get_components()
            alpha = cPCA.get_alpha()

        projected_data = np.round(projected_data, 6).astype(float)
        components = np.round(components, 6).astype(float)
        alpha = np.round(alpha, 6).astype(float)

        data = {'alpha': alpha,
                'cPC1': components[0].tolist(),
                'cPC2': components[1].tolist(),
                'projectedData': projected_data.tolist(),
                }

        rs.set('cpca_all_result', data)

        return JsonResponse(data)


# path('cluster/', views.cluster),
@csrf_exempt
def cluster(request):
    if request.method == 'POST':
        request_data = json.loads(request.body)
        n_clusters = None
        if 'nrOfClusters' in request_data.keys():
            n_clusters = request_data['nrOfClusters']

        cluster_list = get_cluster_list(n_clusters=n_clusters,
                                        dataset=rs['dataset'], client_name=rs['client'],
                                        data=rs['data'], sampling_type=rs['sampling_type'],
                                        outputs_server=rs['outputs_server'], outputs_client=rs['outputs_client'])

        rs.set('clusters', cluster_list)

        data = {'nrOfClusters': len(cluster_list),
                'clusterList': cluster_list}
        return JsonResponse(data)


# path('cpca/cluster', views.cpca_cluster),
@csrf_exempt
def cpca_cluster(request):
    if request.method == 'POST':
        request_data = json.loads(request.body)
        alpha = None
        if 'alpha' in request_data.keys():
            alpha = request_data['alpha']

        bg_data_idx = request_data['dataIndex']

        data = rs.state['data']

        homo_idx = rs.state['outputs_server'] == rs.state['outputs_client']

        bg = data[bg_data_idx]

        if bg.shape[0] == 1:
            return JsonResponse(rs.state['cpca_all_result'])

        fg = np.concatenate((data[homo_idx], bg))

        local_data, _ = load_samples(dataset=rs['dataset'], client_name=rs['client'], sampling_type='local')
        if USE_GPU:
            with torch.no_grad():
                cPCA = CPCA_GPU(n_components=2)
                cPCA.fit(target=fg, background=bg, alpha=alpha)
                projected_data = cPCA.transform(local_data)
                components = cPCA.get_components()
                alpha = cPCA.get_alpha()
        else:
            cPCA = CPCA(n_components=2)
            cPCA.fit(target=fg, background=bg, alpha=alpha)
            projected_data = cPCA.transform(local_data)
            components = cPCA.get_components()
            alpha = cPCA.get_alpha()

        projected_data = np.round(projected_data, 6).astype(float)
        components = np.round(components, 6).astype(float)
        alpha = np.round(alpha, 6).astype(float)

        data = {'alpha': alpha,
                'cPC1': components[0].tolist(),
                'cPC2': components[1].tolist(),
                'projectedData': projected_data.tolist(),
                }

        return JsonResponse(data)


# path('grad_images/', views.grad_images),
@csrf_exempt
def grad_images(request):
    if request.method == 'POST':
        request_data = json.loads(request.body)
        data_idx = request_data['dataIndex']
        data = rs['data'][data_idx]
        target = rs['ground_truth'][data_idx]

        data = data.reshape([-1] + rs['data_shape'].tolist()).transpose([0, 2, 3, 1])

        local_thermos, _ = get_grad_cam_local(dataset=rs['dataset'], client_name=rs['client'], data=data, labels=target)
        fed_thermos, _ = get_grad_cam_server(dataset=rs['dataset'], cm_round=rs['cm_round'], data=data, labels=target)

        data = {'local': {'thermos': local_thermos.reshape([len(local_thermos), -1]).tolist()},
                'fed': {'thermos': fed_thermos.reshape([len(fed_thermos), -1]).tolist()},
                }

        return JsonResponse(data)


# path('instance/', views.instance),
@csrf_exempt
def instance(request):
    if request.method == 'POST':
        request_data = json.loads(request.body)
        data_index = request_data['dataIndex']

        data, _ = load_samples(dataset=rs['dataset'], client_name=rs['client'], sampling_type='local')

        return JsonResponse({'data': data[data_index].tolist()})


# path('instance/', views.instance),
@csrf_exempt
def attribute(request):
    if request.method == 'POST':
        request_data = json.loads(request.body)
        dim_index = request_data['dimIndex']

        data, _ = load_samples(dataset=rs['dataset'], client_name=rs['client'], sampling_type='local')

        attr_data = data[:, dim_index]

        return JsonResponse({'data': attr_data.tolist()})


# path('annotation/', views.annotation),
@csrf_exempt
def annotation(request):
    if request.method == 'POST':
        request_data = json.loads(request.body)
        command = request_data['command']

        if command == 'add':
            data_index = request_data['dataIndex']
            text = request_data['text']
            rs['annotations'].append({'round': rs['cm_round'],
                                      'text': text,
                                      'dataIndex': data_index})
        if command == 'del':
            ann_id = request_data['annotationId']
            annotations = rs['annotations']
            if 0 <= ann_id < len(annotations):
                new_annotations = annotations[:ann_id]
                if ann_id + 1 < len(annotations):
                    new_annotations += annotations[ann_id + 1:]
                rs.set('annotations', new_annotations)
            else:
                return HttpResponseBadRequest()

        return HttpResponse()


# path('annotationList/', views.annotation_list),
@csrf_exempt
def annotation_list(request):
    if request.method == 'GET':
        return JsonResponse({'annotationList': rs['annotations']})
