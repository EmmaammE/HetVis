import torch
from torch.nn.functional import pdist


def calculate_affinity_gpu(data):
    data = torch.tensor(data).double().cuda()  # type: torch.Tensor

    n, d = data.shape

    distances = pdist(data)

    distances_mat = torch.zeros((n, n)).double().cuda()
    cur_idx = 0
    for i in range(n):
        distances_mat[i, i + 1:] = distances[cur_idx: cur_idx + (n - i - 1)]
        cur_idx += (n - i - 1)
    distances_mat = distances_mat + distances_mat.T
    rank = torch.zeros((n, n)).double().cuda()
    for i in range(n):
        rank[i] = torch.argsort(torch.argsort(distances_mat[i]))
    affinity = rank * rank.T

    return affinity.cpu().numpy()
