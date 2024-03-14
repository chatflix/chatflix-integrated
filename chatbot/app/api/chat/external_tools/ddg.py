# Description: This file contains the code to search DuckDuckGo from the command line.
# The results are printed to the console.
# Usage: python ddg.py "search query" -n 10
# NOTE: in development, you have to do python3.12 ddg.py "search query" -n 10 because the dev box is fucked

import argparse
from duckduckgo_search import DDGS

# Set up the argument parser
parser = argparse.ArgumentParser(description='Search with DuckDuckGo from the command line.')
parser.add_argument('search_query', type=str, help='The query to search for.')
parser.add_argument('-n', '--max_results', type=int, default=10, help='The maximum number of results to return. Default is 10.')

# Parse the command line arguments
args = parser.parse_args()

# Conduct the search using the provided query and max_results
with DDGS() as ddgs:
    results = [r for r in ddgs.text(args.search_query, max_results=args.max_results)]
    print(results)
