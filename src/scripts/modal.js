import { CONFIG } from './config.js';

const GOOGLE_FORM_ACTION_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeqkJsPaU2bTmzwuLELj2ygbJLBsfN45js1uvwOmDDF7XEEDQ/formResponse';

const ENTRY_MAP = {
  fullName: 'entry.118746383',
  phone: 'entry.1332627325',
  email: 'entry.998852611',
  area: 'entry.722812867',
  source: 'entry.925381880', // Trường "Nguồn trang" mới tạo trên Google Form
};

export function initConsultationModal() {
  const modal = document.getElementById('consultation-modal');
  if (!modal) return;

  const closeBtn = modal.querySelector('.modal-close-btn');
  const form = modal.querySelector('#consultation-form');
  const submitBtn = modal.querySelector('.btn-modal-submit');
  const errorBox = modal.querySelector('.modal-error-message');
  const formContent = modal.querySelector('.modal-form-content');
  const successState = modal.querySelector('.modal-success-state');
  const successCloseBtn = modal.querySelector('.btn-modal-success-close');

  function openModal() {
    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus on first input
    const firstInput = modal.querySelector('#modal-field-name');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 150);
    }
  }

  function closeModal() {
    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Reset error message
    if (errorBox) {
      errorBox.style.display = 'none';
      errorBox.textContent = '';
    }
  }

  function resetForm() {
    if (form) form.reset();
    if (formContent) formContent.style.display = 'block';
    if (successState) successState.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>✦ Gửi thông tin tư vấn →</span>`;
    }
  }

  // Bind Open Buttons across the page
  const openButtons = document.querySelectorAll('[data-open-modal="consultation-modal"], .btn-header-cta, .open-consultation-modal');
  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // Reset view to form state if previously submitted
      resetForm();
      openModal();
    });
  });

  // Bind Close Buttons
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  if (successCloseBtn) {
    successCloseBtn.addEventListener('click', closeModal);
  }

  // Click outside modal container to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-active')) {
      closeModal();
    }
  });

  // Form Submit Handler
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // 1. Chống bot spam bằng kỹ thuật Honeypot (nếu bot tự động điền ô ẩn thì chặn ngay)
      const honeypotVal = form.querySelector('#modal-honeypot')?.value;
      if (honeypotVal) {
        console.warn('Bot submission blocked via honeypot.');
        if (formContent) formContent.style.display = 'none';
        if (successState) successState.style.display = 'block';
        return;
      }

      // 2. Chống spam click liên tục (Rate limiting - tối thiểu 5s giữa 2 lần bấm)
      const now = Date.now();
      if (form.dataset.lastSubmitTime && now - Number(form.dataset.lastSubmitTime) < 5000) {
        showError('Hệ thống đang xử lý, vui lòng chờ trong giây lát.');
        return;
      }
      form.dataset.lastSubmitTime = now.toString();

      const nameInput = form.querySelector('#modal-field-name');
      const phoneInput = form.querySelector('#modal-field-phone');
      const emailInput = form.querySelector('#modal-field-email');
      const areaInput = form.querySelector('#modal-field-area');

      const fullName = (nameInput?.value || '').trim();
      const phone = (phoneInput?.value || '').trim();
      const email = (emailInput?.value || '').trim();
      const area = (areaInput?.value || '').trim();

      // Validation
      if (!fullName) {
        showError('Vui lòng nhập Họ và tên của bạn.');
        nameInput?.focus();
        return;
      }

      // Check phone: at least 9 digits
      const phoneClean = phone.replace(/[\s\.\-\+]/g, '');
      if (phoneClean.length < 9 || !/^\d+$/.test(phoneClean)) {
        showError('Vui lòng nhập số điện thoại hợp lệ (tối thiểu 9 số).');
        phoneInput?.focus();
        return;
      }

      // Check email
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('Vui lòng nhập địa chỉ email hợp lệ (ví dụ: ten@gmail.com).');
        emailInput?.focus();
        return;
      }

      // Hide previous errors
      if (errorBox) errorBox.style.display = 'none';

      // Set Loading State
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg class="spinner-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
          </svg>
          <span>Đang gửi thông tin...</span>
        `;
      }

      // Tự động gán nguồn landing page
      function getPageSourceInfo() {
        return CONFIG.PAGE_SOURCE || 'Văn bằng 2 - Truyền thông LHU';
      }

      // Prepare Google Form Data
      const bodyData = new URLSearchParams();
      bodyData.append(ENTRY_MAP.fullName, fullName);
      bodyData.append(ENTRY_MAP.phone, phone);
      bodyData.append(ENTRY_MAP.email, email);
      bodyData.append(ENTRY_MAP.area, area);
      bodyData.append(ENTRY_MAP.source, getPageSourceInfo());

      try {
        // Send via fetch with no-cors mode
        await fetch(GOOGLE_FORM_ACTION_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: bodyData.toString()
        });

        // Show Success View
        if (formContent) formContent.style.display = 'none';
        if (successState) successState.style.display = 'block';

      } catch (err) {
        console.warn('Lỗi khi submit bằng fetch, thực hiện fallback iframe:', err);

        // Fallback: Submit through hidden iframe
        try {
          submitViaHiddenIframe(bodyData);
          if (formContent) formContent.style.display = 'none';
          if (successState) successState.style.display = 'block';
        } catch (iframeErr) {
          showError('Không thể gửi thông tin lúc này. Bạn vui lòng thử lại hoặc gọi điện hotline.');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>✦ Gửi thông tin tư vấn →</span>`;
          }
        }
      }
    });
  }

  function showError(msg) {
    if (errorBox) {
      errorBox.textContent = msg;
      errorBox.style.display = 'block';
    }
  }

  function submitViaHiddenIframe(params) {
    let iframe = document.getElementById('google-form-hidden-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'google-form-hidden-iframe';
      iframe.name = 'google-form-hidden-iframe';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    }

    const hiddenForm = document.createElement('form');
    hiddenForm.method = 'POST';
    hiddenForm.action = GOOGLE_FORM_ACTION_URL;
    hiddenForm.target = 'google-form-hidden-iframe';
    hiddenForm.style.display = 'none';

    for (const [key, value] of params.entries()) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      hiddenForm.appendChild(input);
    }

    document.body.appendChild(hiddenForm);
    hiddenForm.submit();
    setTimeout(() => hiddenForm.remove(), 2000);
  }
}
