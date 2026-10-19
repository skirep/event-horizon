import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',
 timeout:420000,
 expect:{timeout:15000},
 use:{baseURL:'http://127.0.0.1:4173',viewport:{width:1280,height:800},screenshot:'only-on-failure',actionTimeout:20000,trace:{mode:'retain-on-failure',screenshots:false,snapshots:true,sources:true},launchOptions:{args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']}},
 webServer:{command:'python3 -m http.server 4173 --bind 127.0.0.1',url:'http://127.0.0.1:4173',reuseExistingServer:false},
 reporter:[['list'],['html',{open:'never'}]]
});
