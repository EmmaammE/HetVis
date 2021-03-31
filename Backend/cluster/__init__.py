import os

import numpy as np
from sklearn.cluster import AgglomerativeClustering

from FLHeteroBackend import settings
from cluster.affinity_gpu import calculate_affinity_gpu


def get_cluster_list(n_clusters, dataset, client_name, data, sampling_type, outputs_client, outputs_server,
                     method='rank'):
    n = data.shape[0]

    # Hetero
    idx = outputs_client != outputs_server
    hetero_idx = np.arange(0, n, 1)[idx]

    if method == 'rank':
        affinity = load_affinity(dataset, client_name, sampling_type)
        affinity = affinity[idx][:, idx]

        if n_clusters is None:
            cls = AgglomerativeClustering(n_clusters=2, affinity='precomputed', linkage='single', compute_distances=True)
            cls.fit_predict(affinity)
            distance_rev = cls.distances_[:][::-1]
            acceleration_rev = np.diff(distance_rev, 1)
            n_clusters = acceleration_rev.argmax() + 2

        cls = AgglomerativeClustering(n_clusters=n_clusters, affinity='precomputed', linkage='single')
        cluster_labels = cls.fit_predict(affinity)  # type: np.ndarray
        all_hetero_size = [(cluster_labels == ci).sum() for ci in range(n_clusters)]
        cluster_rank = np.argsort(all_hetero_size)[::-1]
    else:
        if n_clusters is None:
            cls = AgglomerativeClustering(n_clusters=2, compute_distances=True)
            cls.fit_predict(data[hetero_idx])
            distance_rev = cls.distances_[:][::-1]
            acceleration_rev = np.diff(distance_rev, 1)
            n_clusters = acceleration_rev.argmax() + 2

        cls = AgglomerativeClustering(n_clusters=n_clusters)
        cluster_labels = cls.fit_predict(data[hetero_idx])  # type: np.ndarray
        all_hetero_size = [(cluster_labels == ci).sum() for ci in range(n_clusters)]
        cluster_rank = np.argsort(all_hetero_size)[::-1]

    hetero_list = []

    for i, ci in enumerate(cluster_rank):
        idx = (cluster_labels == ci)
        hetero_size = idx.sum()
        data_idx = hetero_idx[idx]

        het = {
            'heteroSize': int(hetero_size),
            'heteroIndex': data_idx.tolist(),
        }
        hetero_list.append(het)

    return hetero_list


def create_affinity(dataset, client_list):
    samples_data = np.load(os.path.join(settings.DATA_HOME[dataset], 'samples.npz'), allow_pickle=True)
    client_names = samples_data['client_names']
    sampling_types = samples_data['sampling_types']
    affinity = {}
    for client_idx, client_name in enumerate(client_names):
        if client_name not in client_list:
            continue
        print('Creating Affinity: {}'.format(client_name))
        affinity[client_name] = {}
        for sampling_type in sampling_types:
            print('  Data Shape:', samples_data[sampling_type][client_idx].shape)
            affinity[client_name][sampling_type] = calculate_affinity_gpu(samples_data[sampling_type][client_idx])
    affinity_file = os.path.join(settings.CACHE_DIR, 'affinity_{}'.format(dataset))
    np.savez_compressed(affinity_file, **affinity)


def calculate_affinity(data):
    data = data.astype(np.float32)
    n, d = data.shape
    affinity = np.zeros((n, n), np.float32)
    distances = np.zeros((n, n), np.float32)
    rank = np.zeros((n, n), np.float32)

    for i in range(n):
        for j in range(i + 1, n):
            distances[i][j] = distances[j][i] = np.linalg.norm(data[i] - data[j])
        rank[i] = np.argsort(np.argsort(distances[i]))

    for i in range(n):
        for j in range(i + 1, n):
            affinity[i][j] = affinity[j][i] = rank[i][j] * rank[j][i]

    return affinity


def load_affinity(dataset, client_name, sampling_type):
    affinity_file = os.path.join(settings.CACHE_DIR, 'affinity_{}.npz'.format(dataset))
    data = np.load(affinity_file, allow_pickle=True)
    return data[client_name].item()[sampling_type]
