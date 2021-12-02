import os
import json

models = []

for subdir, dirs, files in os.walk(r'./project/res/models'):
    subdir = subdir.replace("./project/res", "")

    for file in files:
        print(subdir + "/" + file)
        if file.endswith(".mimodel"):
            override = os.path.join(subdir.replace(
                "models", "model_overrides"), file)
            if os.path.isfile(override):
                models.append(override)
            else:
                models.append(os.path.join(subdir, file))

file = open(r'./project/res/models/model_list.json', 'w')
file.write(json.dumps(models))
print("Wrote model list to ./project/res/models/model_list.json")
