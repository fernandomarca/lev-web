import pstats
from pstats import SortKey

p = pstats.Stats("fastapi_profile.prof")
p.sort_stats(SortKey.CUMULATIVE).print_stats(
    20
)  # Print top 20 functions by cumulative time
