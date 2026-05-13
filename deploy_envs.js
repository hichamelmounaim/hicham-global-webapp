const fs = require('fs');

const COOLIFY_API_KEY = "4|441uKRaXq3SR2dABUxYBreCHCvYVXj9ZryIWpACP20092680";
const COOLIFY_API_URL = "http://72.60.127.71:8000/api/v1";
const APP_UUID = "pvkhv2p4vkhxcxolov5r6chh";

const envsToPush = [
    {
        key: "NEXTAUTH_URL",
        value: "http://pvkhv2p4vkhxcxolov5r6chh.72.60.127.71.sslip.io"
    },
    {
        key: "AUTH_SECRET",
        value: "tXRWXoW8HqFpR5uDnS8daWPVtDlvW4C0T_8nbLSN9SA"
    },
    {
        key: "DATABASE_URL",
        value: "file:./dev.db"
    },
    {
        key: "CRON_SECRET",
        value: "hg-cron-4f8a9c2e1b7d3f0e5a6b8c9d"
    }
];

async function pushEnvs() {
    for (const envVar of envsToPush) {
        console.log(`Pushing ${envVar.key}...`);
        const response = await fetch(`${COOLIFY_API_URL}/applications/${APP_UUID}/envs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${COOLIFY_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(envVar)
        });

        const data = await response.json();
        if (response.ok) {
            console.log(`Successfully added ${envVar.key}`);
        } else {
            console.error(`Failed to add ${envVar.key}:`, data);
        }
    }
    console.log("Done!");
}

pushEnvs();
