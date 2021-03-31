from time import time
from cluster import create_affinity


def preprocess(dataset, client_names):
    create_affinity(dataset, client_names)


if __name__ == '__main__':
    start_time = time()
    # preprocess(dataset='mnist', client_names=['Client-0', 'Client-2'])
    # preprocess(dataset='face', client_names=['Client-0', 'Client-1'])
    preprocess(dataset='cifar10', client_names=['Client-0', 'Client-3'])
    print('Finish in', time() - start_time)
