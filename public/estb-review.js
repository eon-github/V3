// document.querySelectorAll(".post").forEach(post => {
// 	const postId = post.dataset.postId;
// 	const ratings = post.querySelectorAll(".post-rating");
// 	const likeRating = ratings[0];

// 	ratings.forEach(rating => {
// 		const button = rating.querySelector(".post-rating-button");
// 		const count = rating.querySelector(".post-rating-count");

// 		button.addEventListener("click", async () => {
// 			if (rating.classList.contains("post-rating-selected")) {
// 				return;
// 			}

// 			count.textContent = Number(count.textContent) + 1;

// 			ratings.forEach(rating => {
// 				if (rating.classList.contains("post-rating-selected")) {
// 					const count = rating.querySelector(".post-rating-count");

// 					count.textContent = Math.max(0, Number(count.textContent) - 1);
// 					rating.classList.remove("post-rating-selected");
// 				}
// 			});

// 			rating.classList.add("post-rating-selected");

// 			const likeOrDislike = likeRating === rating ? "like" : "dislike";
// 			const response = await fetch(`/posts/${postId}/${likeOrDislike}`);
// 			const body = await response.json();
// 		});
// 	});
// });

const showPopup = document.querySelector('.post-popup');
const popupContainer = document.querySelector('.post-popup-container');
const closePopup = document.querySelector('.post-popup-close-button');

showPopup.addEventListener('click', () => {
	popupContainer.showModal();
})

closePopup.addEventListener('click', () => {
	popupContainer.close();
})



function addModalHandlers(buttonClass, modalClass, closeClass, saveClass) {
    const buttons = document.querySelectorAll(buttonClass);
    const modals = document.querySelectorAll(modalClass);
    const closeButtons = document.querySelectorAll(closeClass);
    const saveButtons = document.querySelectorAll(saveClass);

    buttons.forEach((button, index) => {
        button.addEventListener('click', () => {
            modals[index].showModal();
        });
    });

    closeButtons.forEach((closeButton, index) => {
        closeButton.addEventListener('click', () => {
            modals[index].close();
        });
    });

    if (saveClass) {
        saveButtons.forEach((saveButton, index) => {
            saveButton.addEventListener('click', () => {
                modals[index].close();
            });
        });
    }
}

// For the first set of modals
addModalHandlers('.edit-button', '.edit-popup-container', '.edit-popup-close-button', '.save-post-popup-edit');
addModalHandlers('.del-button', '.delete-popup-container', '.confirm-del-button', '.cancel-del-button');
addModalHandlers('.owner-reply-button', '.owner-reply-container', '.owner-popup-close-button', '.owner-save-post-popup');


 // Object to store the latest ratings for each type
let latestRatings = {};

// Function to send data to the server
function sendDataToServer(formData) {
    // Example URL where you want to send the data
    const url = '/update-comment';

    // Fetch API to send data to the server
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        // Handle response from the server if needed
        console.log('Data sent successfully.');
    })
    .catch(error => {
        // Handle error if the request fails
        console.error('Error sending data:', error);
    });
}

function handleSubmit(event) {
  event.preventDefault(); // Prevent default form submission

  const modals = document.querySelectorAll('.edit-popup-container'); // get the number of edits
  
  // Get form data
  const formData = new FormData(event.target);
  
  // Construct object with only id, title, and desc
  const data = {
      id: formData.get('id'),
      title: formData.get('title'),
      desc: formData.get('desc')
  };

  // Check if all ratings are provided
  const requiredRatings = ['food', 'service', 'ambiance', 'overall'];
  const suffixes = [...Array(modals.length).keys()];
 
  
  console.log(suffixes);
  for (const ratingType of requiredRatings) {
      let ratingProvided = false;
      for (const suffix of suffixes) {
          if (latestRatings.hasOwnProperty(`${ratingType}-${suffix}`)) {
              ratingProvided = true;
              break;
          }
      }
      if (!ratingProvided) {
          alert(`Please provide a ${ratingType} rating.`);
          return; // Prevent further execution
      }
  }

  // Merge form data and latest ratings
  const mergedData = { ...data, ...latestRatings };

  // Send data to the server
  sendDataToServer(mergedData);

  // Close the modal associated with the form


  
  const form = event.target;
  const modalId = form.dataset.modalId; // Retrieve the modal ID from the data attribute
  $("#title-" + modalId).html(data.title);
  $("#desc-" + modalId).html(data.desc);
  console.log("desc show pls: ", data.desc)
  const foodStars = `<img src="images/star.png" alt="" class="stars-1"></img>`.repeat(latestRatings['food-' + modalId])
  const ambianceStars = `<img src="images/star.png" alt="" class="stars-1"></img>`.repeat(latestRatings['ambiance-' + modalId])
  const overallStars = `<img src="images/star.png" alt="" class="stars-1"></img>`.repeat(latestRatings['overall-' + modalId])
  const serviceStars = `<img src="images/star.png" alt="" class="stars-1"></img>`.repeat(latestRatings['service-' + modalId])
  console.log("food stars", foodStars)
  $("#food-" + modalId).html(foodStars);
  $("#ambiance-" + modalId).html(ambianceStars);
  $("#overall-" + modalId).html(overallStars);
  $("#service-" + modalId).html(serviceStars);
  let currDate = new Date().toLocaleDateString();
  console.log(currDate);
  $('#date-' + modalId).html(currDate)
  $('#edited-' + modalId).html("edited")

  
  console.log("MODAL ID: ", modalId); 
  modals[modalId].close();





 
}


// Function to handle star click
function handleStarClick(stars, index, ratingType) {
    stars.forEach((star, index2) => {
        index >= index2 ? star.classList.add("active") : star.classList.remove("active");
    });
    
    // Get the rating value (index + 1 because index is 0-based)
    const ratingValue = index + 1;
    
    // Update the latest rating for the corresponding type
    latestRatings[ratingType] = ratingValue;
  
    // Log the latest rating
    console.log(`Latest ${ratingType} Rating:`, ratingValue);
}

// Initialize listeners for each set of stars
document.querySelectorAll('.stars').forEach(starsContainer => {
    const stars = starsContainer.querySelectorAll('.fa-solid.fa-star');
    const ratingType = starsContainer.id.replace('-stars', ''); // Get the type of rating
    stars.forEach((star, index1) => {
        star.addEventListener("click", () => {
            const starsInContainer = document.querySelectorAll(`#${starsContainer.id} .fa-solid.fa-star`);
            handleStarClick(starsInContainer, index1, ratingType);
            console.log(ratingType)
        });
    });
});

// Get all forms with class 'update-comment' and add submit event listener to each
const forms = document.querySelectorAll('form[name="update-comment"]');
forms.forEach(form => {
    form.addEventListener('submit', handleSubmit);
});


function deleteOnSubmit(event) {
    event.preventDefault(); // Prevent default form submission
  
    // Get form data
    const form = event.target;
    const index = form.dataset.index;

    console.log(index)
    const reviewId = `review-${index}`;
    console.log(reviewId)
   
    const formData = new FormData(form);

    const data = {
      deleteId: formData.get('deleteId')
    };

    console.log(data.deleteId);

    // Send the id to the server using fetch
    fetch('/delete-comment', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.ok) {
            console.log('Comment deleted successfully');
            // Optionally, update UI or perform other actions
            // For example, remove the deleted comment from the UI
            const deletedComment = document.getElementById(reviewId);
            console.log(deletedComment)
            if (deletedComment) {
                deletedComment.remove();
            }
        } else {
            console.error('Failed to delete comment');
            // Handle error
        }
    })
    .catch(error => {
        console.error('Error deleting comment:', error);
        // Handle error
    });
}

const delforms = document.querySelectorAll('form[name="delCommentForm"]');
delforms.forEach(form => {
    form.addEventListener('submit', deleteOnSubmit);
});


document.querySelectorAll('.edit-button').forEach(button => {
    button.addEventListener('click', (event) => {
        console.log("Edit button clicked");
        event.preventDefault();

        $.post('/get-user-info', function(data) {
            console.log("In Ajax");
            const loggedInUsername = data.username; // Get the logged-in user's username from the server response

            // Use event target to get the clicked button and its data index
            const clickedButton = event.target;
            const dataIndex = clickedButton.getAttribute('data-index');
            console.log("Index for user", dataIndex);
            const commenterUsername = document.querySelector(`.review-profile-name-${dataIndex}`).innerText; // Assuming you have an element with the commenter's username and an id like 'commenter-username-0', 'commenter-username-1', etc.
            console.log("commenter user", commenterUsername);
            console.log("logged user", loggedInUsername);

            if (commenterUsername === loggedInUsername) {
                // Proceed with editing
                openEditModal(dataIndex);
                console.log("Match Found");
            } else {
                // Close all modals
                document.querySelectorAll('.edit-popup-container').forEach(modal => {
                    modal.close();
                });
                // Alert and reset
                alert('You are not authorized to edit this comment.');
            }
        })
        .fail(function(error) {
            console.error('Error fetching user information:', error);
            console.log("Error");
        });
    });
});

// function openEditModal(dataIndex) {
//     // Open the modal for editing using the data index
//     const modal = document.querySelector(`.edit-popup-container[data-modal-id="${dataIndex}"]`);
//     if (modal) {
//         modal.showModal();
//     }
// }

document.querySelectorAll('.del-button').forEach(button => {
    button.addEventListener('click', (event) => {
        console.log("Delete button clicked");
        event.preventDefault();

        $.post('/get-user-info', function(data) {
            console.log("In Ajax");
            const loggedInUsername = data.username; // Get the logged-in user's username from the server response

            // Use event target to get the clicked button and its data index
            const clickedButton = event.target;
            const dataIndex = clickedButton.getAttribute('data-index');
            console.log("Index for user", dataIndex);
            const commenterUsername = document.querySelector(`.review-profile-name-${dataIndex}`).innerText; // Assuming you have an element with the commenter's username and an id like 'commenter-username-0', 'commenter-username-1', etc.
            console.log("commenter user", commenterUsername);
            console.log("logged user", loggedInUsername);

            if (commenterUsername === loggedInUsername) {
                // Proceed with deletion
                openDeleteModal(dataIndex);
                console.log("Match Found");
            } else {
                // Close all delete modals
                document.querySelectorAll('.delete-popup-container').forEach(modal => {
                    modal.close();
                });
                // Alert and reset
                alert('You are not authorized to delete this comment.');
            }
        })
        .fail(function(error) {
            console.error('Error fetching user information:', error);
            console.log("Error");
        });
    });
});

// function openDeleteModal(dataIndex) {
//     // Open the modal for deletion using the data index
//     const modal = document.querySelector(`.delete-popup-container[data-modal-id="${dataIndex}"]`);
//     if (modal) {
//         modal.showModal();
//     }
// }





// Object to store the latest ratings for a single set of stars
let latestRatingsSingle = {};

// Function to handle star click for a single set of stars
function handleStarClickSingle(stars, index, ratingType) {
    stars.forEach((star, index2) => {
        index >= index2 ? star.classList.add("active") : star.classList.remove("active");
    });
    
    // Get the rating value (index + 1 because index is 0-based)
    const ratingValue = index + 1;
    
    // Update the latest rating for the corresponding type
    latestRatingsSingle[ratingType] = ratingValue;
  
    // Log the latest rating
    console.log(`Latest ${ratingType} Rating:`, ratingValue);
}

// Initialize listeners for the single set of stars
document.querySelectorAll('.stars').forEach(starsContainer => {
    const stars = starsContainer.querySelectorAll('.fa-solid.fa-star');
    const ratingType = starsContainer.id.split('-')[0]; // Get the type of rating
    stars.forEach((star, index) => {
        star.addEventListener("click", () => {
            handleStarClickSingle(stars, index, ratingType);
        });
    });
});

// Function to send data to the server for creating a comment
function createDataToServer(formData) {
    // Example URL where you want to send the data
    const url = '/create-comment';

    // Fetch API to send data to the server
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (response.ok) {
            console.log('Comment created successfully.');
            // Optionally, clear the form and update the UI
        } else {
            console.error('Failed to create comment');
        }
    })
    .catch(error => {
        // Handle error if the request fails
        console.error('Error sending data:', error);
    });
}

// Function to handle form submission for creating a comment
function handleCreateCommentSubmit(event) {
    event.preventDefault(); // Prevent default form submission

    // Get form data
    const formData = new FormData(event.target);
   
    console.log(formData.get('restonamehere'))
    // Construct object with title, desc, and ratings
    const data = {
        title: formData.get('title'),
        desc: formData.get('desc'),
        restoName: formData.get('restonamehere'),
        foodRating: latestRatingsSingle['food'],
        serviceRating: latestRatingsSingle['service'],
        ambianceRating: latestRatingsSingle['ambiance'],
        overallRating: latestRatingsSingle['overall'],
        date: new Date().toLocaleDateString()

    };

    console.log("CREATE DATA: ", data)

    // Check if all ratings are provided
    const requiredRatings = ['food', 'service', 'ambiance', 'overall'];
    for (const ratingType of requiredRatings) {
        if (!latestRatingsSingle.hasOwnProperty(ratingType)) {
            alert(`Please provide a ${ratingType} rating.`);
            return; // Prevent further execution
        }
    }

    // Send data to the server
    createDataToServer(data);

    // Clear the form and reset ratings
    // event.target.reset();
    // latestRatingsSingle = {};
    // document.querySelectorAll('.stars .fa-solid.fa-star').forEach(star => {
    //     star.classList.remove("active");
    // });
}

// Add event listener to the form
const createCommentForm = document.querySelector('form[name="create-comment"]');
createCommentForm.addEventListener('submit', handleCreateCommentSubmit);
