import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

DATA_DIR = os.path.join(BASE_DIR, 'data')

CACHE_DIR = os.path.join(DATA_DIR, 'cache')

DATA_HOME = {
    'mnist': os.path.join(DATA_DIR, 'datasets', 'mnist'),
    'face': os.path.join(DATA_DIR, 'datasets', 'face'),
    'cifar10': os.path.join(DATA_DIR, 'datasets', 'cifar10'),
}

HISTORY_DIR = {
    'mnist': os.path.join(DATA_DIR, 'history', 'mnist'),
    'face': os.path.join(DATA_DIR, 'history', 'face'),
    'cifar10': os.path.join(DATA_DIR, 'history', 'cifar10'),
}

USE_GPU = True
