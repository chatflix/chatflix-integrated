# checks if the page 1 from our streaming dataset is in the providers dataset
# public/data/datasets/tv/providers.raw.json

import requests
import time

# Dataset containing the results
dataset = {
    "results": [
        {"id": 217216},
        {"id": 52814},
        {"id": 2734},
        {"id": 206586},
        {"id": 1434},
        {"id": 1416},
        {"id": 82452},
        {"id": 549},
        {"id": 102321},
        {"id": 1399},
        {"id": 4614},
        {"id": 456},
        {"id": 502},
        {"id": 11466},
        {"id": 1622},
        {"id": 71712},
        {"id": 79744},
        {"id": 57532},
        {"id": 121},
        {"id": 4057},
    ]
}

success_count = 0
not_found_count = 0

# Iterate over each item in the dataset
for item in dataset["results"]:
    item_id = item["id"]
    url = f"https://vidsrc.to/embed/tv/{item_id}"
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            success_count += 1
        elif response.status_code == 404:
            not_found_count += 1
    except requests.RequestException as e:
        print(f"Request to {url} failed: {e}")
    
    # Wait for 1 second before making the next request
    time.sleep(1)

print(f"Requests succeeded: {success_count}")
print(f"Requests returned 404: {not_found_count}")
