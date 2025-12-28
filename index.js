const express = require('express');
const cors = require('cors');

const PLUGIN_NAME = 'homebridge-blog-light';
const PLATFORM_NAME = 'BlogLightPlatform';

module.exports = (api) => {
    api.registerPlatform(PLATFORM_NAME, BlogLightPlatform);
};

class BlogLightPlatform {
    constructor(log, config, api) {
        this.log = log;
        this.api = api;

        this.config = config || {};
        this.port = this.config.port || 8000;
        this.accessoryName = this.config.name || "Blog Light";

        this.brightness = 10;
        this.Service = api.hap.Service;
        this.Characteristic = api.hap.Characteristic;

        this.accessories = [];

        // 서버 시작
        this.startServer();

        this.api.on('didFinishLaunching', () => {
            this.log.info(`${this.accessoryName} 플랫폼 로딩 완료`);
            this.setupAccessory();
        });
    }

    configureAccessory(accessory) {
        this.log.info('캐시에서 액세서리 복구 중:', accessory.displayName);
        this.accessories.push(accessory);
    }

    setupAccessory() {
        const uuid = this.api.hap.uuid.generate('homebridge:blog-light-' + this.accessoryName);
        const existingAccessory = this.accessories.find(acc => acc.UUID === uuid);

        if (existingAccessory) {
            this.log.info(`기존 액세서리 사용: ${this.accessoryName}`);
            this.linkService(existingAccessory);
        } else {
            this.log.info(`새 액세서리 생성 중: ${this.accessoryName}`);
            const accessory = new this.api.platformAccessory(this.accessoryName, uuid);
            accessory.addService(this.Service.Lightbulb, this.accessoryName);
            this.linkService(accessory);

            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        }
    }

    linkService(accessory) {
        const service = accessory.getService(this.Service.Lightbulb) || accessory.addService(this.Service.Lightbulb);

        service.getCharacteristic(this.Characteristic.On)
            .onGet(() => true)
            .onSet((val) => this.log.info(`${this.accessoryName} 전원:`, val));

        service.getCharacteristic(this.Characteristic.Brightness)
            .onGet(() => this.brightness)
            .onSet((val) => {
                this.brightness = val;
                this.log.info(`${this.accessoryName} 조도 변경: ${val}%`);
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
            res.json({ brightness: this.brightness });
        });

        app.listen(this.port, '0.0.0.0', () => {
            this.log.info(`API 서버 실행 중: 포트 ${this.port}`);
        });
    }
}