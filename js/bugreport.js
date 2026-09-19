class BugReport {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.sending = false;
        this.createModal();
    }

    createModal() {
        const dialog = document.createElement('dialog');
        dialog.className = 'my-modal';
        dialog.innerHTML = `
            <h2>Send a Report</h2>
            <form id="bugReportForm">
                <input type="text" id="bugName" placeholder="Your name" required>
                <textarea id="bugDescription" placeholder="Describe the issue or feature request..." required></textarea>
                <button type="submit">Submit</button>
                <button type="button" onclick="bugReport.close()">Cancel</button>
            </form>
        `;
        document.body.appendChild(dialog);
        this.dialog = dialog;
        this.form = dialog.querySelector('form');
        this.form.onsubmit = (e) => this.submit(e);
    }

    show() {
        this.dialog.showModal();
        Alpine.store('modal').open();
    }

    close() {
        this.dialog.close();
        Alpine.store('modal').close();
    }

    async submit(e) {
        e.preventDefault();
        if (this.sending) return;

        this.sending = true;
        const submitBtn = this.form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        const name = document.getElementById('bugName').value;
        const bug = document.getElementById('bugDescription').value;
        const logs = Alpine.store('logbox').output;
        const locData = Alpine.store('locData');

        const locdatastring = JSON.stringify(locData);

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    bug,
                    userAgent: navigator.userAgent,
                    logs,
                    locdatastring
                })
            });
            const result = await response.json();

            if (result.status === 'success') {
                alert('Report submitted! Thank you.');
                this.form.reset();
                this.close();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            alert('Failed to submit. Please try again.');
            console.error('Report error:', error);
        } finally {
            this.sending = false;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
        }
    }
}

// Initialize
const bugReport = new BugReport('https://script.google.com/macros/s/AKfycby8eVDMclldF55ls1iT-yCcDfQobeTkP7Xf-Ya5jNSIK2PXeZRIWXmVeWpGclK2eITPjA/exec');