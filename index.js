const express = require('express');
const cors = require('cors');

let Accessory, Service, Characteristic;

module.exports = (api) => {
    api.registerPlatform('homebridge-blog-light', 'BlogLightPlatform', BlogLightPlatform);
};

class BlogLightPlatform {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.brightness = 50;

        this.api.on('didFinishLaunching', () => {
            this.setupAccessory();
            this.setupServer();
        });
    }

    setupAccessory() {
        const uuid = this.api.hap.uuid.generate('homebridge:blog-light');
        const accessory = new Accessory('Blog Curtain Light', uuid);

        const lightService = new Service.Lightbulb(this.config.name || 'Blog Light');

        lightService.getCharacteristic(Characteristic.On)
            .onGet(() => true)
            .onSet((value) => { this.log.info('전원 상태:', value); });

        lightService.getCharacteristic(Characteristic.Brightness)
            .onGet(() => this.brightness)
            .onSet((value) => {
                this.brightness = value;
                this.log.info(`조도 변경: ${value}%`);
            });

        accessory.addService(lightService);
        this.api.publishExternalAccessories('homebridge-blog-light', [accessory]);
    }

    setupServer() {
        const app = express();
        app.use(cors());

        app.get('/light', (req, res) => {
            res.json({ brightness: this.brightness });
        });

        app.listen(8080, () => {
            this.log.info('블로그 연동 API 서버가 8000 포트에서 작동 중입니다.');
        });
    }
}