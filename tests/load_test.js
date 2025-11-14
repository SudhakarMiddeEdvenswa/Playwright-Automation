import http from 'k6/http';
import { check, sleep } from 'k6';
import { th } from '@faker-js/faker';

export const options = {
    stages: [
        { duration: '10s', target: 5 },
        { duration: '1m30s', target: 5 },
        { duration: '20s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    },
};

export default function () {
    const res = http.get('https://quickpizza.grafana.com/');
    check(res, { 'status was 200': (r) => r.status == 200 });
    sleep(Math.random() * 5);
}