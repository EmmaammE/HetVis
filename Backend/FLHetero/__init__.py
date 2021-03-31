class RunningState:
    def __init__(self):
        self.state = {}

    def add_dict(self, states: dict):
        for (key, value) in states.items():
            self.state[key] = value

    def set(self, key, value):
        self.state[key] = value

    def __getitem__(self, item):
        return self.state[item]
