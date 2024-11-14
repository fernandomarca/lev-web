from fuzzywuzzy import fuzz
import jellyfish  # Use jellyfish for Soundex and other phonetic algorithms

from metaphone import doublemetaphone
from unidecode import unidecode
import string
import json

# Create a logger instance for this module
import logging

logger = logging.getLogger(__name__)

# Initialize Soundex
soundex = jellyfish.soundex


# Function to transform a string for soundex comparison (optional)
def transform(s):
    return unidecode(s.lower()).translate(str.maketrans("", "", string.punctuation))


def verificar_match(response, response_truth):
    """
    Verifies the match between two names using fuzzy string matching techniques.

    Args:
        response (str): The transcribed name response.
        response_truth (str): The true name to compare against.

    Returns:
        str: A JSON string containing the matching outcome and similarity scores.
    """

    # Calculate similarity scores using different methods
    fuzz_ratio = fuzz.ratio(transform(response_truth), transform(response))
    soundex_similarity = soundex(response_truth) == soundex(response)
    distance_ratio = jellyfish.levenshtein_distance(response_truth, transform(response))
    fuzz_ratio_phonetics = fuzz.ratio(
        doublemetaphone(response_truth)[0], doublemetaphone(response)[0]
    )

    # Log the input and calculated similarity scores at DEBUG level
    logger.debug(f"Comparing '{response}' against '{response_truth}'")
    logger.debug(f"Fuzz ratio: {fuzz_ratio}")
    logger.debug(f"Soundex similarity: {soundex_similarity}")
    logger.debug(f"Levenshtein distance ratio: {distance_ratio}")
    logger.debug(f"Phonetic fuzz ratio: {fuzz_ratio_phonetics}")

    # Define matching criteria (adjust thresholds as needed)
    outcome = False  # Initialize outcome to False
    if fuzz_ratio >= 85.0 and fuzz_ratio_phonetics >= 85.0 and soundex_similarity:
        outcome = True  # Set outcome to True if conditions are met
    # print(response, "Passed")

    # Create a dictionary to store the results
    results = {
        "response": response,
        "response_truth": response_truth,
        "outcome": outcome,
        "fuzz_ratio": fuzz_ratio,
        "soundex_similarity": soundex_similarity,
        "distance_ratio": distance_ratio,
        "fuzz_ratio_phonetics": fuzz_ratio_phonetics,
    }

    # Convert the dictionary to a JSON string
    json_result = json.dumps(results)

    return json_result
