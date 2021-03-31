import torch
import numpy as np
from sklearn.cluster import SpectralClustering


class CPCA_GPU(object):
    def __init__(self, n_components=2):
        self.n_components = n_components
        self.fitted = False
        self.fg = None
        self.bg = None
        self.fg_n, self.fg_d = None, None
        self.bg_n, self.bg_d = None, None
        self.fg_cov = None
        self.bg_cov = None
        self.alpha = None
        self.best_alpha = None

        self.components_ = None

    def fit_transform(self, target, background, alpha=None):
        self.fit(target, background, alpha)
        return self.transform(target)

    def fit(self, target, background, alpha=None):
        self.fg = torch.tensor(target).double().cuda()
        self.fg_n, self.fg_d = self.fg.shape

        self.bg = torch.tensor(background).double().cuda()
        self.bg_n, self.bg_d = self.bg.shape

        mu = torch.mean(self.fg, 0)
        self.fg = (self.fg - mu)
        self.bg = (self.bg - mu)

        # calculate the covariance matrices
        self.fg_cov = self.fg.T.mm(self.fg) / (self.fg_n - 1)
        self.bg_cov = self.bg.T.mm(self.bg) / (self.bg_n - 1)

        if alpha is None:
            alpha = self.find_best_alpha()

        self.update_components(alpha)

        self.fitted = True

    def transform(self, X, alpha=None):
        if alpha is not None:
            self.update_components(alpha)

        X = torch.tensor(X).double().cuda()
        new_X = X.mm(self.components_.T)

        return new_X.cpu().numpy()

    def update_components(self, alpha):
        self.alpha = alpha
        sigma = self.fg_cov - alpha * self.bg_cov
        w, v = torch.linalg.eigh(sigma)
        eig_idx = torch.tensor(np.argpartition(w.cpu().numpy(), -self.n_components)[-self.n_components:])
        eig_idx = eig_idx[torch.argsort(-w[eig_idx])]
        v_top = v[:, eig_idx]
        self.components_ = v_top.T

    def find_best_alpha(self, alphas=None, n_candidates=5):
        if alphas is None:
            alphas = torch.tensor(np.concatenate(([0], np.logspace(-1, 3, 39)))).double().cuda()

        affinity = self.create_affinity_matrix(alphas).cpu().numpy()

        spectral = SpectralClustering(n_clusters=n_candidates, affinity='precomputed')

        spectral.fit(affinity)
        labels = spectral.labels_  # type: torch.Tensor

        # select middle candidate as the best one

        first_idx = np.sort([np.where(labels == label)[0][0] for label in np.unique(labels)])
        selected_label = labels[first_idx[n_candidates // 2]]

        idx = np.where(labels == selected_label)[0]
        affinity_sub_matrix = torch.tensor(affinity[idx][:, idx])
        sum_affinities = torch.sum(affinity_sub_matrix, 0)
        exemplar_idx = idx[torch.argmax(sum_affinities)]
        best_alpha = alphas[exemplar_idx]

        self.best_alpha = best_alpha
        return best_alpha

    def create_affinity_matrix(self, alphas):
        subspaces = list()
        k = len(alphas)
        affinity = torch.tensor(0.5 * np.identity(k)).cuda()

        for alpha in alphas:
            self.update_components(alpha)
            space = self.fg.mm(self.components_.T)
            q, r = torch.linalg.qr(space)
            subspaces.append(q)

        for i in range(k):
            for j in range(i + 1, k):
                q0 = subspaces[i]
                q1 = subspaces[j]
                u, s, v = torch.linalg.svd(q0.T.mm(q1))
                affinity[i, j] = s[0] * s[1]
        affinity = affinity + affinity.T
        affinity_matrix = torch.nan_to_num(affinity)
        return affinity_matrix

    def get_components(self):
        return self.components_.cpu().numpy()

    def get_alpha(self):
        alpha = self.alpha
        if torch.is_tensor(alpha):
            return alpha.item()
        return alpha
