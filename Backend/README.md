# FLHeteroBackend

Here is the official implementation of system backend in paper *"A Visual Analysis Approach for Identifying Heterogeneity in Federated Learning"*.

We implemented the frontend and backend seprately. The implementation of the frontend could be found [here]('../Frontend/').

## Features
 <!-- - Parameter projection in federated learning process -->
 - Implementation of GPU-accelerated cPCA 
 - Rank-based clustering method for contrastive analysis
 - Grad-CAM for CNNs


## Setup

### Dependencies

``` yml
python=3.8.5
django=3.1.5
numpy=1.19.2
matplotlib=3.3.2
pytorch=1.8.0
torchvision=0.9.0
scikit-learn=0.24.1
``` 

### Install Environments

#### Conda (Recommend)
``` cmd
conda env create -f environment.yml
```

### Local settings
We allow users to define data directory and wehter to use gpu acceleration in the file `local_settings.py`.

It can be written as follow:

``` python
BASE_DIR = Path(__file__).resolve().parent

# Base data directory
DATA_DIR = os.path.join(BASE_DIR, 'data')

# Directory for preprocessed files (affinity_xxx.npz)
CACHE_DIR = os.path.join(DATA_DIR, 'cache')

# Directory for sample data files
DATA_HOME = {
    'mnist': os.path.join(DATA_DIR, 'datasets', 'mnist'),
}

# Directory for training history files
HISTORY_DIR = {
    'mnist': os.path.join(DATA_DIR, 'history', 'mnist'),
}

# Set 'True' to use gpu in the process of calculating cPCA and grad-CAM 
USE_GPU = True
```

### Data Requirements

All `*.cp` files are generated by `torch.save(model.state_dict(), filename)`

All `*.npz` files are generated by `numpy.savez_compressed(filename, **data)`

#### Overview
```
DATA_DIR
|
├── DATA_HOME
|   └── samples.npz
|
├── HISTORY_DIR
|   ├── checkpoints
|   |   ├── Client-0
|   |   |   └── Client-0_Local_best.cp
|   |   ├── Client-1
|   |   |   └── Client-1_Local_best.cp
|   |   ├── ...
|   |   └── Server
|   |   |   ├── Server_r0.cp
|   |   |   └── ...
|   ├── outputs
|   |   ├── Client-0_local.npz
|   |   ├── Client-0_Server_r0.npz
|   |   ├── Client-0_Server_r1.npz
|   |   └── ...
|   ├── weights
|   |   ├── Client-0_r0.npz
|   |   ├── ...
|   |   ├── Server_r0.npz
|   |   ├── ...
|   |   ├── cosines.npz
|   |   └── weights_0.npz
|   ├── model_info.npz
|   └── validation.npz
|
└── CACHE_DIR
    ├── affinity_XXX.npz
    └── ...
```

#### Details

- Sample data
  - Samples `DATA_HOME/samples.npz`
    
    Example:
    
    ``` python
    {
        'client_names': ['Client-0', 'Client-1'],  # at least one client
        'sampling_types': ['local',  # required
                           'stratified',  # optional
                           'systematic',  # optional
                          ], 
        'label_names': ['car', 'ship', 'truck'],  # label names corresponding to ground truth
        'type': 'image',
        'shape': [3, 32, 32],  # data shape
        'local': [...],  # raw data
        'stratified': [...],  # sample data
        'systematic': [...],  # sample data
        'ground_truth': [],  # must have the same length as local data's length
        'train_size': 5000,  # size of training dataset
        'test_size': 1000,  # size of test dataset
    }
    ```
- Training history
  - Checkpoints `HISTORY/checkpoints/`
    - Clients `{client_name}/`
      - `{client_name}_Local_best.cp` 
    - Server `Server/`
      - `Server_r0.cp`
      - `Server_r1.cp` 
      - ...
  - Outputs `HISTORY/outputs/`
    - Stand-alone model output `{client_name}_local.npz`
      
      Example:
    
      ``` python
      {
          'local': [...],  # output for raw data
          'stratified': [...],  # output for stratified sample data
          'systematic': [...],  # output for systematic sample data
      }
      ```
    - Federated learning model output for each round `{client_name}_Server_r{round}.npz`
      
      Example:
    
      ``` python
      {
          'local': [...],  # output for raw data
          'stratified': [...],  # output for stratified sample data
          'systematic': [...],  # output for systematic sample data
      }
      ```
  - Weights `HISTORY/weights/`
  
    Parameters sampled from each layer of the model or the entire model.

    - Local updates `{client_name}_r{round}.npz`
      
      Example:
    
      ``` python
      {
          'layers': [[], [], ...],  # parameters sampled from one layer
          'all': [...],  # parameters sampled from all layers
      }
      ```
      
    - Server parameters `Server_r{round}.npz`
      
      Example:
    
      ``` python
      {
          'layers': [[], [], ...],  # parameters sampled from one layer
          'all': [...],  # parameters sampled from all layers
      }
      ```

    - Initial parameters `weights_0.npz`
      
      Example:
    
      ``` python
      {
          'layers': [[], [], ...],  # parameters sampled from one layer
          'all': [...],  # parameters sampled from all layers
      }
      ```
      
    - Cosines between local updates and server parameters `cosines.npz`
      
      Example:
    
      ``` python
      {
          'cosines': [[], [], ...],  # (n_layers, n_round,) cosines for each layer
          'cosines': [...],  # (n_round,) cosines for all layer
      }
      ```
  - Model Information `HISTORY/model_info.npz`
    
    The name of CNN layer must include `'conv'` (required for grad-CAM)
    
    Example:
    
      ``` python
      {
          'layer_names': ['Conv1', 'Conv2', ...],  # layer names from the top to the bottom
      }
      ```
  - Training Process `HISTORY/validation.npz`

    Example:
    
      ``` python
      {
          'loss': [...],  # (n_round,) training loss of each round
          'val_acc': [...],
          'tot_acc': [...],
      }
      ```

### Run

#### Only for Development

``` cmd
python manage.py runserver 0.0.0.0:port
```

Then you can set `"proxy"` as `"ip:port"` in the file `package.json` at the [frontend](../Frontend/).

Finally, start the frontend to use the system.