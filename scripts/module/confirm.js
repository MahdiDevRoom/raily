export default {
    init() {
        this.root = document.getElementById('confirm');

        this.titleEl =
            this.root.querySelector('.header .title');

        this.messageEl =
            this.root.querySelector('.body .message');

        this.confirmBtn =
            this.root.querySelector('.footer .confirm');

        this.cancelBtn =
            this.root.querySelector('.footer .cancel');

        this.bg =
            this.root.querySelector('.bg');

        this.confirmBtn.onclick = () => {
            if (this.onConfirm) {
                this.onConfirm();
            }

            this.close();
        };

        this.cancelBtn.onclick = () => {
            if (this.onCancel) {
                this.onCancel();
            }

            this.close();
        };

        this.bg.onclick = () => {
            if (this.onCancel) {
                this.onCancel();
            }

            this.close();
        };

        document.addEventListener('keydown', e => {
            if (
                e.key === 'Escape' &&
                this.root.classList.contains('active')
            ) {
                if (this.onCancel) {
                    this.onCancel();
                }

                this.close();
            }
        });

        return this;
    },

    open({
        title = 'تایید',
        message = 'آیا از انجام این کار مطمئن هستید؟',
        confirmText = 'تایید',
        cancelText = 'انصراف',
        onConfirm = null,
        onCancel = null
    } = {}) {
        this.titleEl.textContent = title;
        this.messageEl.textContent = message;
        this.confirmBtn.textContent = confirmText;
        this.cancelBtn.textContent = cancelText;

        this.onConfirm = onConfirm;
        this.onCancel = onCancel;

        this.root.classList.add('active');
    },

    close() {
        this.root.classList.remove('active');
    }
};