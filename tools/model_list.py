import os
import json

models_dir = r'./project/res/models'
res_dir = r'./project/res'

models = []

for subdir, dirs, files in os.walk(models_dir):
    subdir = subdir.replace("./project/res", "")

    for file in files:
        if file.endswith(".mimodel"):
            override = os.path.join(subdir.replace(
                "models", "model_overrides"), file)
            if os.path.isfile(res_dir + override):
                models.append(override)
            else:
                models.append(os.path.join(subdir, file))

file = open(r'./project/res/models/model_list.json', 'w')
file.write(json.dumps(models))
print("Wrote model list to ./project/res/models/model_list.json")
