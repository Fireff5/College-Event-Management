async function test() {
    try {
        // First login to get token
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'password'
            })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;

        // Fetch participants
        const getRes = await fetch('http://localhost:5000/api/participants', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const participants = await getRes.json();
        if (participants.length === 0) {
            console.log('No participants found');
            return;
        }

        const p = participants[0];
        console.log('Editing participant:', p.id);
        console.log('Current events:', p.registered_events, typeof p.registered_events);

        // Try PUT
        const putPayload = {
            name: p.name + ' Edited',
            email: p.email,
            phone: p.phone,
            department: p.department,
            year: p.year,
            institute: p.institute,
            events: p.registered_events
        };

        const putRes = await fetch(`http://localhost:5000/api/participants/${encodeURIComponent(p.id)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(putPayload)
        });

        console.log('PUT Status:', putRes.status);
        if (!putRes.ok) {
            const putErr = await putRes.text();
            console.error('PUT Failed Output:', putErr);
        }

        // Try DELETE with a fake participant first to prevent data loss
        const delRes = await fetch(`http://localhost:5000/api/participants/NON_EXISTENT`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('DELETE Status for NON_EXISTENT:', delRes.status);
    } catch (e) {
        console.error('Initial Error:', e.message);
    }
}

test();
