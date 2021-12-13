import os
import json

models_dir = r'./project/res/models'
model_overrides_dir = r'./project/res/model_overrides'

models = {}

for subdir, dirs, files in os.walk(models_dir):
    subdir = subdir.replace("./project/res", "")

    for file in files:
        if file.endswith(".mimodel"):
            models[file] = os.path.join(subdir, file)

for subdir, dirs, files in os.walk(model_overrides_dir):
    subdir = subdir.replace("./project/res", "")

    for file in files:
        if file.endswith(".mimodel"):
            models[file] = os.path.join(subdir, file)

file = open(r'./project/res/models/model_list.json', 'w')
file.write(json.dumps(list(models.values())))
print("Wrote model list to ./project/res/models/model_list.json")
