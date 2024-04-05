document.addEventListener("DOMContentLoaded", function () {
  const searchForm = document.querySelector(".search-form-comments");
  const searchInput = document.querySelector(".search-input-comments");
  const currentURL = window.location.href; // Get the current URL

  searchForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the form from submitting traditionally

    const queryTC = searchInput.value.trim();

    if (queryTC) {
      // If search query exists, append it to the current URL along with the restaurant link
      const restaurantLink = currentURL.split('/').pop(); // Extract the restaurant link from the URL
      const searchURL = `/${restaurantLink}?query=${encodeURIComponent(queryTC)}`;
      window.location.href = searchURL; // Redirect to the search URL
    }
  });
});
