import os

import numpy as np

from FLHeteroBackend import settings


def load_samples(dataset, client_name, sampling_type):
    samples_file = os.path.join(settings.DATA_HOME[dataset], 'samples.npz')
    samples_data = np.load(samples_file, allow_pickle=True)
    client_names = samples_data['client_names']
    client_idx = np.where(client_names == client_name)[0][0]
    samples = {
        'local': samples_data['local'][client_idx],
        'stratified': samples_data['stratified'][client_idx],
        'systematic': samples_data['systematic'][client_idx],
    }
    ground_truth = samples_data['ground_truth'][client_idx]

    return samples[sampling_type], ground_truth


def load_outputs(datasets, client_name, sampling_type, cm_round):
    output_file = os.path.join(settings.HISTORY_DIR[datasets], 'outputs',
                               '{}_Server_r{}.npz'.format(client_name, cm_round))
    outputs_server = np.load(output_file)[sampling_type]
    output_file = os.path.join(settings.HISTORY_DIR[datasets], 'outputs', '{}_local.npz'.format(client_name))
    outputs_client = np.load(output_file)[sampling_type]
    return {'outputs_server': outputs_server, 'outputs_client': outputs_client}


def load_weights(dataset_name, client_name, n_rounds):
    data_home = os.path.join(settings.HISTORY_DIR[dataset_name], 'weights')
    layer_names = np.load(os.path.join(settings.HISTORY_DIR[dataset_name], 'model_info.npz'))['layer_names']
    layer_names = list(layer_names) + ['All']
    weights_0 = np.load(os.path.join(data_home, 'weights_0.npz'), allow_pickle=True)
    weights_0 = list(weights_0['layers']) + [weights_0['all']]

    client_weights = [[] for _ in layer_names]
    server_weights = [[] for _ in layer_names]

    for r in range(n_rounds):
        client_weights_data = np.load(os.path.join(data_home, '{}_r{}.npz'.format(client_name, r)), allow_pickle=True)
        server_weights_data = np.load(os.path.join(data_home, 'Server_r{}.npz'.format(r)), allow_pickle=True)

        cw = list(client_weights_data['layers']) + [client_weights_data['all']]
        cs = list(server_weights_data['layers']) + [server_weights_data['all']]

        for idx, (_cw, _cs) in enumerate(zip(cw, cs)):
            client_weights[idx].append(_cw)
            server_weights[idx].append(_cs)

    cosines = np.load(os.path.join(data_home, 'cosines.npz'))[client_name]
    return layer_names, weights_0, client_weights, server_weights, cosines


def load_history(dataset_name):
    data = np.load(os.path.join(settings.HISTORY_DIR[dataset_name], 'validation.npz'))
    client_names = data['client_names']
    n_clients = client_names.shape[0]
    loss = data['loss']
    val_acc = data['val_acc']
    tot_acc = data['tot_acc']
    n_rounds = loss.shape[1]
    return {'client_names': client_names,
            'n_clients': n_clients,
            'loss': loss,
            'val_acc': val_acc,
            'tot_acc': tot_acc,
            'n_rounds': n_rounds,
            }


def get_load_data_size(dataset, client_name):
    samples_file = os.path.join(settings.DATA_HOME[dataset], 'samples.npz')
    samples_data = np.load(samples_file, allow_pickle=True)
    client_names = samples_data['client_names']
    client_idx = np.where(client_names == client_name)[0][0]
    train_size = samples_data['train_size'][client_idx]
    test_size = samples_data['test_size'][client_idx]
    return train_size, test_size


def get_cosines(weights_0, weights_server, weights_client):
    w0 = weights_0
    cosines = []
    for (w1, w2) in zip(weights_client, weights_server):
        cosines.append(cos_v(w1 - w0, w2 - w0))
        w0 = w2
    return np.array(cosines)


def cos_v(v1: np.ndarray, v2: np.ndarray):
    return v1.dot(v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))


def sample_weight(weights_0, weights_client, weights_server, num):
    n = weights_0.shape[0]
    if n <= num:
        return weights_0, weights_client, weights_server
    np.random.seed(0)
    idx = np.random.permutation(n)[:num]
    w0 = weights_0[idx]
    wc = np.array([w[idx] for w in weights_client])
    ws = np.array([w[idx] for w in weights_server])
    return w0, wc, ws
