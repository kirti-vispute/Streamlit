import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, orderBy, query, serverTimestamp, updateDoc, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC6gvn7RRTxlFLN9kqMzrn3hS26b9vCMYM",
    authDomain: "ayursutra-f90d2.firebaseapp.com",
    projectId: "ayursutra-f90d2",
    storageBucket: "ayursutra-f90d2.appspot.com",
    messagingSenderId: "1014791978312",
    appId: "1:1014791978312:web:938b6861c94f0a3a81477d",
    measurementId: "G-Y0CDSS5NWD"
};
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        // --- GLOBAL TOAST NOTIFICATION ---
        let toastTimeout;
        function showToast(message, type = 'success') {
            const toast = document.getElementById('global-toast');
            const toastMessage = document.getElementById('toast-message');
            
            clearTimeout(toastTimeout);

            toastMessage.textContent = message;
            toast.classList.remove('bg-sage-600', 'bg-red-500');

            if (type === 'success') {
                toast.classList.add('bg-sage-600');
            } else {
                toast.classList.add('bg-red-500');
            }

            toast.classList.add('active');

            toastTimeout = setTimeout(() => {
                toast.classList.remove('active');
            }, 4000);
        }
        
        // --- AUTH & PAGE SETUP ---
        onAuthStateChanged(auth, user => {
            if (user) {
                getDoc(doc(db, "users", user.uid)).then(docSnap => {
                    if (docSnap.exists() && docSnap.data().profileCompleted) {
                        setupDashboard(docSnap.data());
                    } else {
                        showPage('profile-completion-section', 'Complete Your Profile');
                    }
                });
            } else {
                window.location.href = 'loginup.html';
            }
        });

        function setupDashboard(userData) {
            const welcomeMessage = document.getElementById('welcome-message');
            if(welcomeMessage) {
                welcomeMessage.textContent = `Welcome, ${userData.name}!`;
                welcomeMessage.classList.remove('hidden');
            }
            showPage('dashboard-section');
        }

        // --- PROFILE FORM ---
        document.getElementById('new-user-profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) return;
            const userDocRef = doc(db, "users", user.uid);
            const profileData = {
                name: document.getElementById('new-user-name').value,
                dob: document.getElementById('new-user-dob').value,
                dosha: document.getElementById('new-user-dosha').value,
                allergy: document.getElementById('new-user-allergy').value,
                profileCompleted: true
            };
            try {
                await updateDoc(userDocRef, profileData);
                const updatedDoc = await getDoc(userDocRef);
                setupDashboard(updatedDoc.data());
            } catch (error) {
                console.error("Error updating profile: ", error);
                showToast("Could not save profile. Please try again.", 'error');
            }
        });
        
        // --- UI NAVIGATION ---
        function showPage(pageId, title = '') {
            const activePage = document.querySelector('.page-content.active');
            if (activePage) {
                activePage.classList.remove('active');
                setTimeout(() => {
                    activePage.style.display = 'none';
                    activateNewPage(pageId, title);
                }, 400);
            } else {
                activateNewPage(pageId, title);
            }
        }

        function activateNewPage(pageId, title) {
            const newPage = document.getElementById(pageId);
            if (newPage) {
                newPage.style.display = 'block';
                setTimeout(() => newPage.classList.add('active'), 20);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            document.getElementById('page-title').textContent = title;
        }
        
        // --- LOGOUT ---
        document.getElementById('logout-button').addEventListener('click', () => {
            signOut(auth).then(() => {
                window.location.href = 'index.html';
            }).catch((error) => console.error("Logout Error:", error));
        });

        // --- DASHBOARD BUTTON LISTENERS ---
        document.getElementById('logo-link').addEventListener('click', (e) => {
            e.preventDefault();
            showPage('dashboard-section', '');
        });

        document.getElementById('profile-btn').addEventListener('click', async () => {
            const user = auth.currentUser;
            if (!user) return;
            const userDocRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                document.getElementById('profile-name').textContent = data.name || 'N/A';
                document.getElementById('profile-dosha').textContent = data.dosha ? `${data.dosha} Dosha` : 'Dosha not set';
                document.getElementById('profile-dob').textContent = data.dob || 'Not provided';
                document.getElementById('profile-allergies').textContent = data.allergy || 'None reported';
            }
            showPage('profile-section', 'My Profile');
        });
        document.getElementById('profile-back-btn').addEventListener('click', () => showPage('dashboard-section', ''));


        // --- TREATMENTS & CART LOGIC ---
        const treatments = [
            { id: 1, name: 'Abhyanga', description: 'A full-body massage with warm, herb-infused oils to nourish the skin and calm the nervous system.', dosha: 'Vata', duration: '60 min', price: 3500, image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=500&q=80' },
            { id: 2, name: 'Shirodhara', description: 'A continuous stream of warm oil is gently poured over the forehead, promoting deep relaxation and mental clarity.', dosha: 'Pitta', duration: '45 min', price: 4000, image: 'https://cdn.sanity.io/images/n6vy78g9/production/839690c8eb01854cfdac14d4050105c3f03eae58-1920x1080.png' },
            { id: 3, name: 'Udvartana', description: 'An invigorating massage with a paste of powdered herbs to exfoliate the skin and improve circulation.', dosha: 'Kapha', duration: '50 min', price: 3200, image: 'https://saatwika.in/wp-content/uploads/2022/10/Udwarthanam-Ayurvedic-Treatment-.jpg' },
            { id: 4, name: 'Pizhichil', description: 'A luxurious treatment where warm medicated oil is squeezed over the entire body from a cloth.', dosha: 'Vata', duration: '75 min', price: 5500, image: 'https://www.ayurcentre.sg/img/therapies/pizhichil-ayurvedic-treatment-1.png' },
            { id: 5, name: 'Netra Tarpana', description: 'A restorative eye treatment using lukewarm ghee to soothe and nourish the eyes.', dosha: 'Pitta', duration: '30 min', price: 2500, image: 'https://healingearth.co.in/wp-content/uploads/2025/04/1_638320850489249255111738.webp' },
            { id: 6, name: 'Swedana', description: 'An herbal steam therapy to open up the body’s channels and flush out toxins.', dosha: 'Kapha', duration: '20 min', price: 1800, image: 'https://www.swasthyaayurveda.com/wp-content/uploads/2021/02/swasthya-steam-bath.jpg' },
        ];
        let cart = [];

        function renderTreatments(filter = 'all') {
            const grid = document.getElementById('treatments-grid');
            if (!grid) return;
            grid.innerHTML = ''; 
            const filteredTreatments = filter === 'all' ? treatments : treatments.filter(t => t.dosha === filter);
            filteredTreatments.forEach(treatment => {
                const card = document.createElement('div');
                card.className = 'bg-cream-50 p-6 rounded-2xl shadow-md border border-sage-100 flex flex-col transition transform hover:-translate-y-1 hover:shadow-lg';
                card.innerHTML = `
                    <img src="${treatment.image}" alt="${treatment.name}" class="w-full h-48 object-cover rounded-lg mb-4">
                    <h3 class="text-2xl font-serif font-bold text-sage-900 mb-2">${treatment.name}</h3>
                    <p class="font-text text-sage-800 flex-grow mb-4">${treatment.description}</p>
                    <div class="flex justify-between items-center text-sage-700 border-t border-sage-200 pt-3 mb-4">
                        <span class="font-medium"><strong>Duration:</strong> ${treatment.duration}</span>
                        <span class="text-xl font-semibold text-sage-900">₹${treatment.price}</span>
                    </div>
                    <button data-id="${treatment.id}" class="add-to-cart-btn mt-auto w-full py-3 bg-sage-600 text-white rounded-full font-semibold hover:bg-sage-700 transition">Add to Cart</button>
                `;
                grid.appendChild(card);
            });
        }
        
        function updateCartBadge() {
            const badge = document.getElementById('cart-badge');
            badge.textContent = cart.length;
            if (cart.length > 0) {
                badge.classList.add('cart-bounce');
                setTimeout(() => badge.classList.remove('cart-bounce'), 600);
            }
        }

        function renderCart() {
            const container = document.getElementById('cart-items-container');
            const summaryContainer = document.getElementById('cart-summary');
            const checkoutBtn = document.getElementById('cart-checkout-btn');
            if (!container || !summaryContainer) return;
            container.innerHTML = '';
            summaryContainer.innerHTML = '';
            
            if (cart.length === 0) {
                container.innerHTML = `<p class="text-center text-sage-700">Your wellness cart is empty.</p>`;
                if (checkoutBtn) checkoutBtn.classList.add('hidden');
                return;
            }

            if (checkoutBtn) checkoutBtn.classList.remove('hidden');
            let total = 0;
            cart.forEach(item => {
                total += item.price;
                const itemDiv = document.createElement('div');
                itemDiv.className = 'flex justify-between items-center border-b border-sage-200 pb-3';
                itemDiv.innerHTML = `
                    <div>
                        <h4 class="font-semibold text-sage-900">${item.name}</h4>
                        <p class="text-sm text-sage-600">${item.duration}</p>
                    </div>
                    <div class="flex items-center gap-4">
                         <span class="font-semibold text-lg text-sage-900">₹${item.price}</span>
                         <button data-id="${item.id}" class="remove-from-cart-btn text-red-500 hover:text-red-700 text-2xl font-bold">×</button>
                    </div>
                `;
                container.appendChild(itemDiv);
            });
            summaryContainer.innerHTML = `<p class="text-2xl font-serif font-bold text-sage-900">Total: ₹${total}</p>`;
        }
        
        document.getElementById('treatment-filters').addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                renderTreatments(e.target.dataset.filter);
            }
        });

        document.getElementById('treatments-grid').addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart-btn')) {
                const treatmentId = parseInt(e.target.dataset.id);
                const treatmentToAdd = treatments.find(t => t.id === treatmentId);
                if (treatmentToAdd) {
                    cart.push(treatmentToAdd);
                    updateCartBadge();
                    showToast(`${treatmentToAdd.name} added to cart!`, 'success');
                }
            }
        });
        
        document.getElementById('cart-items-container').addEventListener('click', (e) => {
            if(e.target.classList.contains('remove-from-cart-btn')) {
                const treatmentId = parseInt(e.target.dataset.id);
                const itemIndex = cart.findIndex(item => item.id === treatmentId);
                if (itemIndex > -1) {
                    cart.splice(itemIndex, 1);
                }
                renderCart();
                updateCartBadge();
            }
        });
        
        // --- BOOKING LOGIC ---
        function populateBookingSummary() {
            const list = document.getElementById('booking-treatments-list');
            if (!list) return;
            list.innerHTML = '';
            const submitButton = document.querySelector('#booking-form button[type="submit"]');
            
            if (cart.length === 0) {
                list.innerHTML = '<p class="text-sage-700">Your cart is empty. Please add treatments first.</p>';
                if(submitButton) submitButton.classList.add('hidden');
                return;
            }
            
            if(submitButton) submitButton.classList.remove('hidden');
            let total = 0;
            cart.forEach(item => {
                total += item.price;
                const itemDiv = document.createElement('div');
                itemDiv.className = 'flex justify-between items-center';
                itemDiv.innerHTML = `<span>${item.name}</span> <span class="font-medium">₹${item.price}</span>`;
                list.appendChild(itemDiv);
            });
            
            const totalDiv = document.createElement('div');
            totalDiv.className = 'flex justify-between items-center font-bold text-sage-900 border-t border-sage-200 mt-4 pt-2';
            totalDiv.innerHTML = `<span>Total</span> <span>₹${total}</span>`;
            list.appendChild(totalDiv);

            const today = new Date().toISOString().split('T')[0];
            document.getElementById('appointment-date').setAttribute('min', today);
        }
        
        document.getElementById('booking-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) { showToast("You must be logged in to book.", 'error'); return; }

            const appointmentData = {
                userId: user.uid,
                date: document.getElementById('appointment-date').value,
                time: document.getElementById('appointment-time').value,
                center: document.getElementById('appointment-center').value,
                practitioner: document.getElementById('appointment-practitioner').value,
                treatments: cart.map(item => ({ id: item.id, name: item.name, price: item.price })),
                totalPrice: cart.reduce((acc, item) => acc + item.price, 0),
                status: 'Confirmed',
                createdAt: serverTimestamp()
            };
            
            try {
                await addDoc(collection(db, 'appointments'), appointmentData);
                document.getElementById('confirmation-details').innerText = `Your appointment with ${appointmentData.practitioner} at our ${appointmentData.center} center is confirmed for ${appointmentData.date} at ${appointmentData.time}.`;
                cart = [];
                updateCartBadge();
                showPage('confirmation-section', 'Confirmation');
            } catch (error) {
                console.error("Error booking appointment: ", error);
                showToast("Could not book the appointment. Please try again.", 'error');
            }
        });
        
        // --- MY APPOINTMENTS LOGIC ---
        async function fetchAndDisplayAppointments() {
            const user = auth.currentUser;
            if (!user) return;
            const appointmentsList = document.getElementById('appointments-list');
            appointmentsList.innerHTML = '<p class="text-center text-sage-700">Loading your appointments...</p>';
            const q = query(collection(db, "appointments"), where("userId", "==", user.uid), orderBy("date", "desc"));
            try {
                const querySnapshot = await getDocs(q);
                if (querySnapshot.empty) {
                    appointmentsList.innerHTML = `
                        <div class="text-center bg-cream-50 p-8 rounded-lg">
                            <p class="text-xl text-sage-700 mb-4">You have no upcoming or past appointments.</p>
                            <button id="appt-book-now-btn" class="px-8 py-3 bg-sage-600 text-white rounded-full font-medium hover:bg-sage-700 transition">Book a Treatment</button>
                        </div>`;
                    document.getElementById('appt-book-now-btn').addEventListener('click', () => {
                        renderTreatments();
                        showPage('treatments-section', 'Our Treatments');
                    });
                    return;
                }

                appointmentsList.innerHTML = '';
                const upcomingAppointments = [];
                const pastAppointments = [];
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                querySnapshot.forEach((doc) => {
                    const appt = { id: doc.id, ...doc.data() };
                    const apptDate = new Date(appt.date);
                    if (apptDate >= today && appt.status !== 'Cancelled') {
                        upcomingAppointments.push(appt);
                    } else {
                        pastAppointments.push(appt);
                    }
                });

                if (upcomingAppointments.length > 0) {
                    const upcomingHeader = `<h3 class="text-3xl font-serif font-light tracking-wide text-sage-900 mb-4 border-b border-sage-200 pb-2">Upcoming Appointments</h3>`;
                    const upcomingHtml = upcomingAppointments.map(appt => renderAppointmentCard(appt)).join('');
                    appointmentsList.innerHTML += `<div>${upcomingHeader}${upcomingHtml}</div>`;
                }

                if (pastAppointments.length > 0) {
                    const pastHeader = `<h3 class="text-3xl font-serif font-light tracking-wide text-sage-900 mb-4 border-b border-sage-200 pb-2 mt-10">Past Appointments</h3>`;
                    const pastHtml = pastAppointments.map(appt => renderAppointmentCard(appt, true)).join('');
                    appointmentsList.innerHTML += `<div>${pastHeader}${pastHtml}</div>`;
                }
                
                if (upcomingAppointments.length === 0 && pastAppointments.length === 0) {
                     appointmentsList.innerHTML = `<p class="text-center text-sage-700">You have no appointments to display.</p>`;
                }

            } catch (error) {
                console.error("Error fetching appointments:", error);
                showToast("Could not load appointments.", 'error');
            }
        }

        function renderAppointmentCard(appt, isPast = false) {
            const treatmentsHtml = appt.treatments.map(t => `<li class="ml-4 font-text">${t.name} (₹${t.price})</li>`).join('');
            const date = new Date(appt.date);
            const formattedDate = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

            let actionButtons = '';
            if (appt.status === 'Cancelled') {
                actionButtons = `<button data-treatments='${JSON.stringify(appt.treatments)}' class="book-again-btn px-4 py-2 text-sm bg-sage-600 text-white rounded-full font-medium hover:bg-sage-700 transition">Book Again</button>`;
            } else if (isPast) {
                actionButtons = `<button data-treatments='${JSON.stringify(appt.treatments)}' class="book-again-btn px-4 py-2 text-sm bg-sage-600 text-white rounded-full font-medium hover:bg-sage-700 transition">Book Again</button>`;
            } else {
                actionButtons = `<button data-id="${appt.id}" data-treatments='${JSON.stringify(appt.treatments)}' class="reschedule-btn px-4 py-2 text-sm bg-white border border-sage-300 text-sage-800 rounded-full font-medium hover:bg-sage-50 transition mr-2">Reschedule</button>
                                 <button data-id="${appt.id}" class="cancel-btn px-4 py-2 text-sm bg-red-100 border border-red-200 text-red-700 rounded-full font-medium hover:bg-red-200 transition">Cancel</button>`;
            }
            
            return `
                <div class="bg-cream-50 p-6 rounded-2xl shadow-md border border-sage-100 mb-4 ${isPast || appt.status === 'Cancelled' ? 'opacity-60' : ''}">
                    <div class="flex flex-col sm:flex-row justify-between sm:items-start">
                        <div>
                            <h3 class="text-2xl font-serif font-bold text-sage-900">${formattedDate} at ${appt.time}</h3>
                            <p class="text-base text-sage-700 mt-1">with ${appt.practitioner} at ${appt.center}</p>
                            <p class="text-base text-sage-600 mt-2 font-medium">Status: <span class="font-bold">${appt.status}</span></p>
                        </div>
                        <p class="text-2xl font-serif font-bold text-sage-800 mt-2 sm:mt-0">₹${appt.totalPrice}</p>
                    </div>
                    <div class="border-t border-sage-200 mt-4 pt-4">
                        <h4 class="font-semibold text-sage-700 mb-2">Treatments Booked:</h4>
                        <ul class="list-disc list-inside text-sage-800 space-y-1">${treatmentsHtml}</ul>
                    </div>
                    <div class="border-t border-sage-200 mt-4 pt-4 text-right">
                        ${actionButtons}
                    </div>
                </div>`;
        }
        
        document.getElementById('appointments-list').addEventListener('click', async (e) => {
            const user = auth.currentUser;
            if (!user) return;
            
            if (e.target.classList.contains('cancel-btn')) {
                const docId = e.target.dataset.id;
                if (confirm('Are you sure you want to cancel this appointment?')) {
                    const apptDocRef = doc(db, "appointments", docId);
                    try {
                        await updateDoc(apptDocRef, { status: 'Cancelled' });
                        showToast('Appointment cancelled successfully.', 'success');
                        fetchAndDisplayAppointments();
                    } catch (error) {
                        console.error("Error cancelling appointment:", error);
                        showToast("Could not cancel the appointment. Please try again.", 'error');
                    }
                }
            }
            
            if (e.target.classList.contains('reschedule-btn') || e.target.classList.contains('book-again-btn')) {
                const treatmentsToBook = JSON.parse(e.target.dataset.treatments);
                const confirmationText = e.target.classList.contains('reschedule-btn')
                    ? 'This will cancel your current appointment and add its treatments to your cart so you can rebook. Continue?'
                    : 'This will add the treatments from this past appointment to your cart. Continue?';

                if (confirm(confirmationText)) {
                    if(e.target.classList.contains('reschedule-btn')){
                        const docId = e.target.dataset.id;
                        const apptDocRef = doc(db, "appointments", docId);
                        try {
                           await updateDoc(apptDocRef, { status: 'Cancelled' });
                        } catch(error) {
                            console.error("Error cancelling for reschedule:", error);
                            showToast("Could not cancel the original appointment. Please try again.", 'error');
                            return;
                        }
                    }
                    cart = [...treatmentsToBook];
                    updateCartBadge();
                    populateBookingSummary();
                    showPage('booking-section', 'Reschedule Your Appointment');
                }
            }
        });

        // --- MY WELLNESS PLAN LOGIC ---
        const doshaRecommendations = {
            Vata: {
                title: "Recommendations for Vata Dosha",
                focus: "Focus on warmth, grounding, and routine to balance your airy nature.",
                diet: ["Eat warm, well-cooked, and nourishing foods.", "Incorporate sweet, sour, and salty tastes.", "Avoid cold, raw, or dry foods and reduce caffeine."],
                lifestyle: ["Maintain a regular daily routine, including meal times and sleep.", "Practice gentle, calming exercise like yoga, tai chi, or walking.", "Get plenty of rest and stay warm in cold, windy weather."]
            },
            Pitta: {
                title: "Recommendations for Pitta Dosha",
                focus: "Embrace coolness, moderation, and relaxation to soothe your fiery intensity.",
                diet: ["Favor cool, refreshing, and slightly dry foods.", "Incorporate sweet, bitter, and astringent tastes.", "Reduce spicy, salty, and sour foods, as well as alcohol."],
                lifestyle: ["Avoid excessive heat and prolonged sun exposure.", "Practice calming activities like swimming or walking in nature.", "Make time for leisure and avoid overworking or skipping meals."]
            },
            Kapha: {
                title: "Recommendations for Kapha Dosha",
                focus: "Incorporate stimulation, warmth, and activity to invigorate your earthy stability.",
                diet: ["Eat light, warm, and dry foods. Think spiced and well-cooked.", "Favor pungent, bitter, and astringent tastes.", "Limit heavy, oily, cold, and sweet foods, including dairy."],
                lifestyle: ["Engage in regular, vigorous exercise to boost circulation and energy.", "Seek out new experiences and avoid daytime naps.", "Keep your environment warm and dry, using a diffuser with uplifting scents."]
            }
        };

        async function fetchAndDisplayPlan() {
            const container = document.getElementById('wellness-plan-content');
            const user = auth.currentUser;
            if (!user) return;

            container.innerHTML = `<p class="text-center text-sage-700">Loading your recommendations...</p>`;

            try {
                const userDocRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(userDocRef);

                if (!docSnap.exists() || !docSnap.data().dosha) {
                    container.innerHTML = `<div class="bg-cream-50 p-8 rounded-2xl shadow-md border border-sage-100 text-center">
                        <h3 class="text-3xl font-serif text-sage-900 mb-4">No Recommendations Found</h3>
                        <p class="text-sage-800">Please complete your profile to receive personalized recommendations for your Dosha.</p>
                    </div>`;
                    return;
                }

                const userDosha = docSnap.data().dosha;
                const plan = doshaRecommendations[userDosha];

                if (!plan) {
                    container.innerHTML = `<p class="text-center text-sage-700">Could not find recommendations for your Dosha.</p>`;
                    return;
                }
                
                let componentsHtml = `
                    <div class="mb-6">
                        <h4 class="text-2xl font-serif text-sage-800 mb-3">Dietary Advice</h4>
                        <ul class="space-y-2">
                            ${plan.diet.map(item => `<li class="flex items-start">
                                <svg class="w-6 h-6 text-sage-500 mr-3 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                                <span class="font-text text-sage-800">${item}</span>
                            </li>`).join('')}
                        </ul>
                    </div>
                    <div>
                        <h4 class="text-2xl font-serif text-sage-800 mb-3">Lifestyle Recommendations</h4>
                        <ul class="space-y-2">
                            ${plan.lifestyle.map(item => `<li class="flex items-start">
                                <svg class="w-6 h-6 text-sage-500 mr-3 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                                <span class="font-text text-sage-800">${item}</span>
                            </li>`).join('')}
                        </ul>
                    </div>
                `;

                container.innerHTML = `
                    <div class="bg-cream-50 p-8 rounded-2xl shadow-md border border-sage-100">
                        <div class="text-center border-b border-sage-200 pb-6 mb-6">
                            <h3 class="text-4xl font-serif font-bold text-sage-900">${plan.title}</h3>
                        </div>
                        <p class="font-text text-center text-xl text-sage-800 italic mb-6">"${plan.focus}"</p>
                        ${componentsHtml}
                    </div>
                `;

            } catch (error) {
                console.error("Error fetching user profile for plan:", error);
                showToast("Could not load your recommendations.", 'error');
            }
        }
        let progressChart = null;

        const sampleChartData = {
            weight: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
                data: [75, 74.5, 74, 73, 72.5, 72],
                label: 'Weight (kg)',
                borderColor: '#456334', // sage-700
                backgroundColor: 'rgba(69, 99, 52, 0.1)',
            },
            sleep: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                data: [6, 7, 6.5, 8, 7.5, 8.5, 8],
                label: 'Sleep Quality (hours)',
                borderColor: '#8faa76', // sage-400
                backgroundColor: 'rgba(143, 170, 118, 0.1)',
            },
            bp: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                data: [130, 128, 125, 126, 124, 122],
                label: 'Blood Pressure (Systolic)',
                borderColor: '#b3c49c', // sage-300
                backgroundColor: 'rgba(179, 196, 156, 0.1)',
            }
        };

        function renderProgressChart(metric = 'weight') {
            const ctx = document.getElementById('progressChart').getContext('2d');
            const chartData = sampleChartData[metric];

            if (progressChart) {
                progressChart.destroy();
            }

            progressChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: chartData.label,
                        data: chartData.data,
                        borderColor: chartData.borderColor,
                        backgroundColor: chartData.backgroundColor,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: false,
                            grid: { color: '#e8ede0' }, // sage-100
                            ticks: { font: { size: 14, family: "'Inter', sans-serif" }, color: '#39502c' } // sage-800
                        },
                        x: {
                            grid: { display: false },
                            ticks: { font: { size: 14, family: "'Inter', sans-serif" }, color: '#39502c' } // sage-800
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                font: { size: 16, family: "'Crimson Text', serif" },
                                color: '#39502c' // sage-800
                            }
                        }
                    }
                }
            });
        }

        document.getElementById('chart-filters').addEventListener('click', (e) => {
            if (e.target.classList.contains('chart-btn')) {
                document.querySelectorAll('.chart-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                renderProgressChart(e.target.dataset.chart);
            }
        });
        
        document.getElementById('feedback-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) {
                showToast("You must be logged in to submit feedback.", 'error');
                return;
            }
            
            const ratingInput = document.querySelector('input[name="rating"]:checked');
            if (!ratingInput) {
                showToast("Please select a star rating.", 'error');
                return;
            }

            const feedbackData = {
                userId: user.uid,
                rating: parseInt(ratingInput.value),
                comments: document.getElementById('feedback-comments').value,
                submittedAt: serverTimestamp()
            };

            try {
                await addDoc(collection(db, 'feedback'), feedbackData);
                showToast('Thank you for your feedback!', 'success');
                document.getElementById('feedback-form').reset();
                showPage('dashboard-section', '');
            } catch (error) {
                console.error("Error submitting feedback:", error);
                showToast("Could not submit feedback. Please try again.", 'error');
            }
        });
        
         document.getElementById('emergency-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) {
                showToast("You must be logged in to submit this form.", 'error');
                return;
            }
            
            const emergencyData = {
                userId: user.uid,
                symptoms: document.getElementById('emergency-comments').value,
                submittedAt: serverTimestamp(),
                status: 'New'
            };

            try {
                await addDoc(collection(db, 'emergencies'), emergencyData);
                showToast('Staff has been notified. Please expect a call shortly.', 'success');
                document.getElementById('emergency-form').reset();
                showPage('dashboard-section', '');
            } catch (error) {
                console.error("Error submitting emergency form:", error);
                showToast("Could not submit the form. Please call us directly.", 'error');
            }
        });

        // --- EVENT LISTENERS FOR NEWLY ADDED SECTIONS ---
        document.getElementById('charts-btn').addEventListener('click', () => {
            showPage('charts-section', 'My Progress');
            renderProgressChart(); // Render the default chart
        });
        
        // --- Add New Event Listeners ---
        document.getElementById('plans-btn').addEventListener('click', () => {
            fetchAndDisplayPlan();
            showPage('plans-section', 'My Wellness Plan');
        });

        
        // --- ALL BUTTON EVENT LISTENERS ---
        document.getElementById('treatments-btn').addEventListener('click', () => {
            renderTreatments();
            showPage('treatments-section', 'Our Treatments');
        });
        document.getElementById('book-appointment-btn').addEventListener('click', () => {
            if(cart.length === 0){
                renderTreatments();
                showPage('treatments-section', 'Our Treatments');
            } else {
                populateBookingSummary();
                showPage('booking-section', 'Book Your Appointment');
            }
        });
        document.getElementById('appointments-btn').addEventListener('click', () => {
            fetchAndDisplayAppointments();
            showPage('appointments-section', 'My Appointments');
        });
        document.getElementById('charts-btn').addEventListener('click', () => showPage('charts-section', 'My Progress'));
        document.getElementById('feedback-btn').addEventListener('click', () => showPage('feedback-section', 'Provide Feedback'));
        
        document.getElementById('cart-icon').addEventListener('click', () => {
            renderCart();
            showPage('cart-section', 'Your Wellness Cart');
        });
        document.getElementById('confirmation-done-btn').addEventListener('click', () => showPage('dashboard-section', ''));
        document.getElementById('cart-checkout-btn').addEventListener('click', () => {
            populateBookingSummary();
            showPage('booking-section', 'Book Your Appointment');
        });

        // Back Buttons
        document.getElementById('treatments-back-btn').addEventListener('click', () => showPage('dashboard-section', ''));
        document.getElementById('cart-back-btn').addEventListener('click', () => showPage('treatments-section', 'Our Treatments'));
        document.getElementById('booking-back-btn').addEventListener('click', () => showPage('cart-section', 'Your Wellness Cart'));
        document.getElementById('appointments-back-btn').addEventListener('click', () => showPage('dashboard-section', ''));
        document.getElementById('plans-back-btn').addEventListener('click', () => showPage('dashboard-section', ''));
        document.getElementById('charts-back-btn').addEventListener('click', () => showPage('dashboard-section', ''));
        document.getElementById('feedback-btn').addEventListener('click', () => showPage('feedback-section', 'Provide Feedback'));
        document.getElementById('feedback-back-btn').addEventListener('click', () => showPage('dashboard-section', ''));
        document.getElementById('emergency-btn').addEventListener('click', () => showPage('emergency-section', 'Emergency Help'));

        document.getElementById('emergency-back-btn').addEventListener('click', () => showPage('dashboard-section', ''));

