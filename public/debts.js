(() => {
    const storageKey = 'cevinpay.debts.v1';
    const byId = (id) => document.getElementById(id);
    const money = (amount) => `${formatMoney(amount)} ₫`;
    const date = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' });
    const editDialog = byId('debtEditDialog');
    const qrDialog = byId('debtQrDialog');
    const billDialog = byId('debtBillDialog');
    const editForm = byId('debtEditForm');
    const qrForm = byId('debtQrForm');
    const editMessage = byId('debtEditMessage');
    const qrMessage = byId('debtQrMessage');
    const billMessage = byId('debtBillMessage');
    const pageMessage = byId('debtMessage');
    const nameInput = byId('debtName');
    const amountInput = byId('debtAmount');
    const noteInput = byId('debtNote');
    const qrAmount = byId('debtQrAmount');
    const qrNote = byId('debtQrNote');
    const bank = byId('debtBank');
    const generate = byId('debtGenerateBtn');
    const share = byId('debtShareBtn');
    const paid = byId('debtBillPaidBtn');
    const billImage = byId('debtBillImage');
    let debts = [];
    let editingId;
    let qrDebt;
    let pendingQr;
    let bill;

    function readDebts() {
        const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
        if (!Array.isArray(saved)) throw new Error('Invalid debt storage');
        const outstanding = saved.filter((debt) => !debt.paidAt);
        if (outstanding.length !== saved.length) {
            localStorage.setItem(storageKey, JSON.stringify(outstanding));
        }
        return outstanding;
    }

    function refresh() {
        try {
            debts = readDebts();
            pageMessage.textContent = '';
        } catch {
            pageMessage.textContent = 'Không đọc được sổ ghi nợ trên trình duyệt.';
        }
        render();
    }

    function save(change, message) {
        try {
            const updated = change(readDebts());
            if (!updated) {
                refresh();
                message.textContent = 'Khoản nợ đã thay đổi. Hãy mở lại để tiếp tục.';
                return false;
            }
            localStorage.setItem(storageKey, JSON.stringify(updated));
            debts = updated;
            pageMessage.textContent = '';
            render();
            return true;
        } catch {
            message.textContent = 'Không lưu được. Hãy kiểm tra quyền lưu dữ liệu của trình duyệt.';
            return false;
        }
    }

    function updateDebt(debt, replacement, message) {
        return save((current) => {
            if (!current.some((item) => item.id === debt.id && JSON.stringify(item) === JSON.stringify(debt))) {
                return null;
            }
            return replacement
                ? current.map((item) => item.id === debt.id ? replacement : item)
                : current.filter((item) => item.id !== debt.id);
        }, message);
    }

    function action(label, callback, primary = false) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `btn ${primary ? 'btn-pill-dark' : 'debt-secondary'}`;
        button.textContent = label;
        button.addEventListener('click', callback);
        return button;
    }

    function renderDebt(debt) {
        const row = document.createElement('li');
        const title = document.createElement('div');
        title.className = 'debt-row-title';
        const name = document.createElement('strong');
        name.textContent = debt.name;
        const amount = document.createElement('strong');
        amount.textContent = money(debt.amount);
        title.append(name, amount);
        row.append(title);

        const detail = document.createElement('p');
        detail.textContent = [debt.note, `Ghi ngày ${date.format(debt.createdAt)}`, debt.received ? `Đã thu ${money(debt.received)}` : '']
            .filter(Boolean).join(' · ');
        row.append(detail);

        const actions = document.createElement('div');
        actions.className = 'debt-actions';
        actions.append(
            action('Tạo QR', () => openQr(debt), true),
            action('Đã thanh toán', () => recordPayment(debt, debt.amount, pageMessage)),
            action('Sửa', () => openEdit(debt))
        );
        actions.append(action('Xóa', () => {
            if (window.confirm(`Xóa khoản nợ của ${debt.name} khỏi sổ?`)) {
                updateDebt(debt, null, pageMessage);
            }
        }));
        row.append(actions);
        return row;
    }

    function render() {
        const total = debts.reduce((sum, debt) => sum + BigInt(debt.amount), 0n);
        byId('debtSummary').textContent = `Còn phải thu ${money(total)} · ${debts.length} khoản`;
        byId('debtOpenList').replaceChildren(...debts.map(renderDebt));
        byId('debtEmpty').hidden = debts.length > 0;
    }

    function recordPayment(debt, amount, message) {
        const remaining = debt.amount - amount;
        return updateDebt(debt, remaining ? {
            ...debt,
            amount: remaining,
            received: debt.received + amount
        } : null, message);
    }

    function openEdit(debt) {
        editingId = debt;
        editMessage.textContent = '';
        byId('debtEditTitle').textContent = debt ? 'Sửa khoản nợ' : 'Thêm khoản nợ';
        nameInput.value = debt?.name ?? '';
        amountInput.value = debt ? formatMoney(debt.amount) : '';
        noteInput.value = debt?.note ?? '';
        editDialog.showModal();
    }

    function readAmount(input) {
        const value = input.value.trim();
        if (!/^\d+(?:[.,]\d{3})*$/.test(value)) return 0;
        const amount = Number(parseMoney(value));
        return Number.isSafeInteger(amount) ? amount : 0;
    }

    editForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = nameInput.value.trim().replace(/\s+/g, ' ');
        const amount = readAmount(amountInput);
        const note = noteInput.value.trim();
        if (!name || !amount || !Number.isSafeInteger(amount + (editingId?.received ?? 0))) {
            editMessage.textContent = 'Nhập họ tên và số tiền hợp lệ lớn hơn 0 ₫.';
            return;
        }
        const saved = editingId
            ? updateDebt(editingId, { ...editingId, name, amount, note }, editMessage)
            : save((current) => [{
                id: crypto.randomUUID(), name, amount, note, received: 0, createdAt: Date.now()
            }, ...current], editMessage);
        if (saved) editDialog.close();
    });

    function withoutAccents(text) {
        return text.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
    }

    function openQr(debt) {
        qrDebt = debt;
        qrAmount.value = formatMoney(debt.amount);
        qrAmount.dataset.maxAmount = String(debt.amount);
        qrNote.value = [
            withoutAccents(debt.name).toUpperCase(),
            'chuyen tien',
            withoutAccents(debt.note).toLowerCase().replace(/\s+/g, ' ')
        ].filter(Boolean).join(' ').slice(0, qrNote.maxLength).trimEnd();
        bank.value = getActiveAccount().code;
        qrMessage.textContent = '';
        qrDialog.showModal();
    }

    qrForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const debt = qrDebt;
        const amount = readAmount(qrAmount);
        const description = qrNote.value.trim();
        const acc = ACCOUNTS[bank.value];
        if (!amount || amount > debt.amount) {
            qrMessage.textContent = `Nhập số tiền lớn hơn 0 và tối đa ${money(debt.amount)}.`;
            return;
        }
        const request = {};
        pendingQr = request;
        generate.disabled = true;
        qrMessage.textContent = 'Đang tạo bill QR…';
        try {
            const src = await fetchQrSrc(String(amount), description, acc);
            const canvas = await renderBillCanvas({ acc, amount: String(amount), description, src });
            const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
            if (!blob) throw new Error('Could not export bill');
            if (pendingQr !== request || !qrDialog.open) return;

            const file = new File([blob], 'cevinpay-qr-thu-no.png', { type: 'image/png' });
            const url = URL.createObjectURL(file);
            bill = { debt, amount, file, url };
            billImage.src = url;
            byId('debtBillDetails').textContent = [acc.shortName, money(amount), description].filter(Boolean).join(' · ');
            share.textContent = navigator.canShare?.({ files: [file] }) && navigator.share ? 'Chia sẻ ảnh' : 'Tải ảnh';
            billMessage.textContent = '';
            qrDialog.close();
            billDialog.showModal();
        } catch {
            if (pendingQr === request && qrDialog.open) {
                qrMessage.textContent = 'Chưa tạo được bill QR. Hãy kiểm tra kết nối rồi thử lại.';
            }
        } finally {
            if (pendingQr === request) {
                pendingQr = null;
                generate.disabled = false;
            }
        }
    });

    qrDialog.addEventListener('close', () => {
        if (qrDialog.open) return;
        pendingQr = null;
        generate.disabled = false;
    });

    share.addEventListener('click', async () => {
        const activeBill = bill;
        if (!activeBill) return;
        const { file, url } = activeBill;
        if (navigator.canShare?.({ files: [file] }) && navigator.share) {
            try {
                await navigator.share({ files: [file], title: 'CevinPay · QR thu nợ' });
                return;
            } catch (error) {
                if (error.name === 'AbortError' || bill !== activeBill) return;
            }
        }
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        billMessage.textContent = 'Đã yêu cầu tải ảnh PNG.';
    });

    paid.addEventListener('click', () => {
        if (bill && recordPayment(bill.debt, bill.amount, billMessage)) billDialog.close();
    });

    billDialog.addEventListener('close', () => {
        if (!billDialog.open && bill) {
            billImage.removeAttribute('src');
            URL.revokeObjectURL(bill.url);
            bill = null;
        }
    });

    for (const button of document.querySelectorAll('[data-close-dialog]')) {
        button.addEventListener('click', () => button.closest('dialog').close());
    }

    const qrViewBtn = byId('qrViewBtn');
    const debtViewBtn = byId('debtViewBtn');
    function showDebts(show) {
        byId('qrView').hidden = show;
        byId('debtView').hidden = !show;
        qrViewBtn.setAttribute('aria-pressed', String(!show));
        debtViewBtn.setAttribute('aria-pressed', String(show));
        if (show) refresh();
    }

    byId('addDebtBtn').addEventListener('click', () => openEdit());
    qrViewBtn.addEventListener('click', () => showDebts(false));
    debtViewBtn.addEventListener('click', () => showDebts(true));
    window.addEventListener('storage', (event) => {
        if (event.key === storageKey || event.key === null) refresh();
    });
    refresh();
})();
