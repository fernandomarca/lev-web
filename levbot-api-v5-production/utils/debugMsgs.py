import time


def time_lapse(start_time, end_time, function=""):
    elapsed_time = end_time - start_time
    print(
        f"Time for processing function " + function + ": {elapsed_time:.2f} seconds",
    )
