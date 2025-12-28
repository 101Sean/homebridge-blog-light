const express = require('express');
const cors = require('cors');

module.exports = (api) => {
    api.registerPlatform('BlogLightPlatform', BlogLightPlatform);
};

class BlogLightPlatform {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;

        this.brightness = 10;
        this.Service = api.hap.Service;
        this.Characteristic = api.hap.Characteristic;

        this.accessories = [];

        this.startServer();

        this.api.on('didFinishLaunching', () => {
            this.log.info('블로그 조명 플랫폼 로딩 완료');
            this.setupAccessory();
        });
    }

    configureAccessory(accessory) {
        this.log.info('캐시에서 액세서리 복구 중:', accessory.displayName);
        this.accessories.push(accessory);
    }

    setupAccessory() {
        const name = "Blog Light";
        const uuid = this.api.hap.uuid.generate('homebridge:blog-light');

        const existingAccessory = this.accessories.find(acc => acc.UUID === uuid);

        if (existingAccessory) {
            this.log.info('기존 액세서리 사용');
            this.linkService(existingAccessory);
        } else {
            this.log.info('새 액세서리 생성 중...');
            const accessory = new this.api.platformAccessory(name, uuid);
            accessory.addService(this.Service.Lightbulb, name);
            this.linkService(accessory);

            this.api.registerPlatformAccessories('homebridge-blog-light', 'BlogLightPlatform', [accessory]);
        }
    }

    linkService(accessory) {
        const service = accessory.getService(this.Service.Lightbulb);

        service.getCharacteristic(this.Characteristic.On)
            .onGet(() => true)
            .onSet((val) => this.log.info('전원:', val));

        service.getCharacteristic(this.Characteristic.Brightness)
            .onGet(() => this.brightness)
            .onSet((val) => {
                this.brightness = val;
                this.log.info(`조도 변경: ${val}%`);
            });
    }

    startServer() {
        const app = express();

        app.use(cors({
            origin: '*',
            methods: ['GET', 'POST', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'ngrok-skip-browser-warning']
        }));

        app.get('/light', (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, ngrok-skip-browser-warning');
            res.setHeader('ngrok-skip-browser-warning', 'true');

            res.json({ brightness: this.brightness });
        });

        app.listen(8000, '0.0.0.0', () => {
            this.log.info('API 서버 실행 중: 8010');
        });
    }
}