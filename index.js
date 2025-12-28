const express = require('express');
const cors = require('cors');

module.exports = (api) => {
    api.registerPlatform('homebridge-blog-light', 'BlogLightPlatform', BlogLightPlatform);
};

class BlogLightPlatform {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;

        this.brightness = 50;
        this.Service = api.hap.Service;
        this.Characteristic = api.hap.Characteristic;

        this.accessories = [];

        this.api.on('didFinishLaunching', () => {
            this.log.info('블로그 조명 플랫폼 로딩 완료');
            this.setupAccessory();
            this.startServer();
        });
    }

    configureAccessory(accessory) {
        this.log.info('캐시된 액세서리 불러오는 중:', accessory.displayName);
        this.accessories.push(accessory);
    }

    setupAccessory() {
        const name = "Blog Curtain Light";
        const uuid = this.api.hap.uuid.generate('homebridge:blog-light-unique-v1');

        const existingAccessory = this.accessories.find(acc => acc.UUID === uuid);

        if (existingAccessory) {
            this.log.info('기존 액세서리 사용:', existingAccessory.displayName);
            this.updateCharacteristics(existingAccessory);
        } else {
            this.log.info('새 액세서리 등록 중...');
            const accessory = new this.api.platformAccessory(name, uuid);
            accessory.addService(this.Service.Lightbulb, name);
            this.updateCharacteristics(accessory);

            this.api.registerPlatformAccessories('homebridge-blog-light', 'BlogLightPlatform', [accessory]);
        }
    }

    updateCharacteristics(accessory) {
        const service = accessory.getService(this.Service.Lightbulb);

        service.getCharacteristic(this.Characteristic.On)
            .onGet(() => true)
            .onSet((value) => { this.log.info('전원 상태:', value); });

        service.getCharacteristic(this.Characteristic.Brightness)
            .onGet(() => this.brightness)
            .onSet((value) => {
                this.brightness = value;
                this.log.info(`조도 변경: ${value}%`);
            });
    }

    startServer() {
        const app = express();
        app.use(cors());
        app.get('/light', (req, res) => res.json({ brightness: this.brightness }));

        app.listen(8000, '0.0.0.0', () => {
            this.log.info('API 서버 실행 중: http://localhost:8080/light');
        });
    }
}