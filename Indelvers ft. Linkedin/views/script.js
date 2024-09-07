document.addEventListener("DOMContentLoaded", function() {
  const statusMessage = document.getElementById("status-message");
  const authorizeBtn = document.getElementById("authorize-btn");

  authorizeBtn.addEventListener("mouseover", function() {
      statusMessage.textContent = "You're one step away from connecting your LinkedIn account!";
  });

  authorizeBtn.addEventListener("mouseout", function() {
      statusMessage.textContent = "Click the button below to authorize your LinkedIn account.";
  });

  authorizeBtn.addEventListener("click", function() {
      statusMessage.textContent = "Redirecting to LinkedIn...";
  });
});
