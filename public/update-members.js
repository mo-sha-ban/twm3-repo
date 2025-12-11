// Function to update the member count
function updateMemberCount() {
  const memberCountElement = document.getElementById("member-count");

  // Get the current count from local storage or set it to the initial value
  let currentCount = parseInt(localStorage.getItem("memberCount")) || 50000;

  // Get the last updated date from local storage
  const lastUpdated = localStorage.getItem("lastUpdated");
  const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

  // Check if the count needs to be updated
  if (lastUpdated !== today) {
    // Increase the count by 250 for each day since the last update
    const daysPassed = lastUpdated
      ? Math.floor(
          (new Date(today) - new Date(lastUpdated)) / (1000 * 60 * 60 * 24)
        )
      : 0;
    currentCount += daysPassed * 250;

    // Update local storage with the new count and today's date
    localStorage.setItem("memberCount", currentCount);
    localStorage.setItem("lastUpdated", today);
  }

  // Update the displayed member count
  memberCountElement.textContent = currentCount.toLocaleString(); // Format number with commas

  // Increment the count by 250 every second
  setInterval(() => {
    currentCount += 0.0029; // Increase count by 250 every second
    memberCountElement.textContent = currentCount.toLocaleString(); // Update displayed count
    localStorage.setItem("memberCount", currentCount); // Store updated count in local storage
  }, 1000);

  // Listen for changes to localStorage (for other tabs)
  window.addEventListener("storage", (e) => {
    if (e.key === "memberCount") {
      // If memberCount is updated in another tab, sync the count
      memberCountElement.textContent = parseInt(e.newValue).toLocaleString();
    }
  });
}

// Call the function to update the member count on page load
updateMemberCount();
