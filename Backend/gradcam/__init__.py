import os

import numpy as np
import torch
from torch.nn.functional import relu, interpolate
from torchvision import transforms as T

from gradcam.models import CIFARModel, FaceModel
from local_settings import USE_GPU, HISTORY_DIR

device = 'cuda:0' if USE_GPU else 'cpu'

criterion = torch.nn.CrossEntropyLoss()

MODEL = {
    'cifar10': CIFARModel,
    'face': FaceModel,
}


def grad_cam(model, image, label):
    image = image.unsqueeze(0).to(device)  # type: torch.Tensor
    image.requires_grad = True
    if image.grad is not None:
        image.grad.data.zero_()
    target = torch.tensor([label]).long().to(device)
    layers = model.layers
    layer_names = model.layer_names

    features = []
    inputs = image
    outputs = None

    for layer_name, layer in zip(layer_names, layers):
        outputs = layer(inputs)
        if 'conv' in layer_name.lower():
            features.append(outputs)
        inputs = outputs

    for feature in features:  # type: torch.Tensor
        feature.retain_grad()

    loss = criterion(outputs, target)  # type: torch.Tensor
    loss.backward()

    thermos = []

    for feature in features:
        thermo_grad = feature.grad.detach()
        thermo = -1 * thermo_grad.detach() * feature.detach()
        thermo = torch.sum(relu(thermo, inplace=True), dim=1, keepdim=True)
        thermo = interpolate(thermo, size=(image.size(2), image.size(3)), mode='bilinear', align_corners=True)
        feature.grad.data.zero_()
        thermo = thermo.squeeze()
        thermo = thermo / (torch.max(thermo) + 1e-9)
        thermos.append(thermo.cpu().numpy())

    image_grad = relu(-1 * image.grad, inplace=True).detach()
    image_grad = image_grad.squeeze()
    image_grad = image_grad.permute([1, 2, 0]) / (torch.max(image_grad) + 1e-9)

    return np.array(thermos), image_grad.cpu().numpy()


transforms = T.Compose([T.ToTensor(), T.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))])


def get_grad_cam_server(dataset, cm_round, data, labels):
    ckpt = os.path.join(HISTORY_DIR[dataset], 'checkpoints', 'Server', 'Server_r{}.cp'.format(cm_round))
    model = MODEL[dataset]().to(device)
    model.load_state_dict(torch.load(ckpt))
    return _get_grad_cam(model, data, labels)


def get_grad_cam_local(dataset, client_name, data, labels):
    ckpt = os.path.join(HISTORY_DIR[dataset], 'checkpoints', client_name, '{}_Local_best.cp'.format(client_name))
    model = MODEL[dataset]().to(device)
    model.load_state_dict(torch.load(ckpt))
    return _get_grad_cam(model, data, labels)


def _get_grad_cam(model, data, labels):
    thermos, image_grads = [], []
    for image, label in zip(data, labels):
        image = transforms(image)
        t, ig = grad_cam(model, image, label)
        thermos.append(t)
        image_grads.append(ig)
    n = len(labels)
    thermos = np.reshape(thermos, [n, -1])
    thermos = np.sum(thermos, axis=0) / n
    image_grads = np.reshape(image_grads, [n, -1])
    image_grads = np.sum(image_grads, axis=0) / n
    return np.array(thermos), np.array(image_grads)
