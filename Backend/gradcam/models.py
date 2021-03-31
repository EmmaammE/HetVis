import torch
from torch import nn
import torch.nn.functional as F


class CIFARModel(nn.Module):
    def __init__(self):
        super(CIFARModel, self).__init__()
        self.conv1 = nn.Sequential(
            nn.Conv2d(3, 6, 5),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
        )
        self.conv2 = nn.Sequential(
            nn.Conv2d(6, 16, 5),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
        )
        self.fc1 = nn.Sequential(
            nn.Flatten(),
            nn.Linear(16 * 5 * 5, 120),
            nn.ReLU(),
        )
        self.fc2 = nn.Sequential(
            nn.Linear(120, 84),
            nn.ReLU(),
        )
        self.fc3 = nn.Linear(84, 10)

        self.layers = [self.conv1, self.conv2, self.fc1, self.fc2, self.fc3]
        self.layer_names = ['Conv1', 'Conv2', 'FC1', 'FC2', 'FC3']

    def forward(self, x):
        for layer in self.layers:
            x = layer(x)
        return x


class FaceModel(nn.Module):
    def __init__(self):
        super(FaceModel, self).__init__()
        self.conv1 = nn.Sequential(
            nn.Conv2d(3, 16, 3, padding=1),  # 3*28*28 -> 16*28*28
            nn.ReLU(),
            nn.MaxPool2d(2, 2)  # 16*28*28 -> 16*14*14
        )
        self.conv2 = nn.Sequential(
            nn.Conv2d(16, 32, 3, padding=1),  # 16*14*14 -> 32*14*14
            nn.ReLU(),
            nn.MaxPool2d(2, 2)  # 32*14*14 -> 32*7*7
        )
        self.conv3 = nn.Sequential(
            nn.Conv2d(32, 64, 3, padding=1),  # 32*7*7 -> 64*7*7
            nn.ReLU(),  # 64*7*7 -> 64*1*1
        )
        self.avg_pool = nn.Sequential(
            nn.AvgPool2d(7),
        )
        self.fc1 = nn.Sequential(
            nn.Flatten(),
            nn.Linear(64, 2),
        )

        self.layers = [self.conv1, self.conv2, self.conv3, self.avg_pool, self.fc1]
        self.layer_names = ['Conv1', 'Conv2', 'Conv3', 'AvgPool', 'FC1']

    def forward(self, x):
        for layer in self.layers:
            x = layer(x)
        return x
