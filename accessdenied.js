function showModal() {
    document.getElementById("myModal").style.display = "block";
}

// Function to redirect and hide the modal
function redirect() {
    document.getElementById("myModal").style.display = "none";
    window.location.href = 'http://www.example.com'; // Change to your desired URL
}

// Call the function to show the modal when the page loads
window.onload = showModal;
