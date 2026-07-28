document.addEventListener('DOMContentLoaded', () => {
  // Sizing Calculator Elements
  const calcWeight = document.getElementById('calc-weight');
  const calcGirth = document.getElementById('calc-girth');
  const calcResult = document.getElementById('calc-result');

  // Contact Form
  const contactForm = document.getElementById('dogfriz-contact-form');

  // --- SIZE SELECTOR ---
  const sizeBtns = document.querySelectorAll('.size-btn');
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // --- SIZING CALCULATOR ---
  function calculateSize() {
    if (!calcWeight || !calcGirth || !calcResult) return;
    
    const girth = parseFloat(calcGirth.value);
    const breed = calcWeight.value;

    if (!girth) {
      calcResult.innerText = "Enter your dog's chest girth above to calculate.";
      return;
    }

    let size = 'M';
    if (girth < 20) {
      size = 'S';
    } else if (girth >= 20 && girth < 26) {
      size = 'M';
    } else if (girth >= 26 && girth < 32) {
      size = 'L';
    } else if (girth >= 32) {
      size = 'XL';
    }

    calcResult.innerHTML = `<strong>Recommended Size: ${size}</strong><br><span style="font-size: 12px; color: #64748B;">Based on a chest girth of ${girth}" for a ${breed}.</span>`;

    // Automatically highlight the matching size button if it exists
    const matchingBtn = document.querySelector(`.size-btn[data-size="${size}"]`);
    if (matchingBtn) {
      sizeBtns.forEach(b => b.classList.remove('active'));
      matchingBtn.classList.add('active');
    }
  }

  if (calcWeight) calcWeight.addEventListener('change', calculateSize);
  if (calcGirth) calcGirth.addEventListener('input', calculateSize);

  // --- DYNAMIC TABS ---
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(btn.dataset.tab);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // --- CONTACT FORM ACTIONS ---
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData.entries());

      try {
        const response = await fetch('/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
          // Open user's mail client to send the real email
          const mailtoUrl = `mailto:edigmine@gmail.com?subject=${encodeURIComponent(data.subject + ' - ' + data.name)}&body=${encodeURIComponent("From: " + data.name + " (" + data.email + ")\n\n" + data.message)}`;
          window.location.href = mailtoUrl;

          // Success Feedback
          const container = contactForm.parentElement;
          container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
              <div style="font-size: 50px; margin-bottom: 20px;">✉️</div>
              <h3 style="margin-bottom: 12px; font-family: var(--font-serif); font-size: 24px;">Message Sent!</h3>
              <p style="color: var(--slate-gray); margin-bottom: 24px;">Thank you! We have opened your email client to send your message to edigmine@gmail.com so we can reply directly to your inbox.</p>
              <button class="btn btn-primary" onclick="window.location.reload()">Send Another Message</button>
            </div>
          `;
        } else {
          alert(result.message || 'Something went wrong.');
        }
      } catch (err) {
        console.error('Error submitting form:', err);
        alert('Network error. Please try again.');
      }
    });
  }

  // --- NEWSLETTER SUBSCRIPTION FORM ---
  const newsletterForm = document.getElementById('newsletter-subscription-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('newsletter-email');
      const email = emailInput ? emailInput.value : '';
      if (email) {
        const mailtoUrl = `mailto:edigmine@gmail.com?subject=${encodeURIComponent('Subscribe Dogfriz Safety Alerts')}&body=${encodeURIComponent('Hello! Please subscribe me to canine hot-weather safety alerts. My email address is: ' + email)}`;
        window.location.href = mailtoUrl;
        alert('Thank you! Opening your email client to complete your subscription request to edigmine@gmail.com.');
        newsletterForm.reset();
      }
    });
  }
});
