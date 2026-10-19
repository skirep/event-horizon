import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',
 timeout:300000,
 expect:{timeout:15000},
 use:{baseURL:'http://127.0.0.1:4173',viewport:{width:1440,height:900},screenshot:'only-on-failure',trace:'retain-on-failure',launchOptions:{args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}},
 webServer:{command:'python3 -m http.server 4173 --bind 127.0.0.1',url:'http://127.0.0.1:4173',reuseExistingServer:false},
 reporter:[['list'],['html',{open:'never'}]]
});
