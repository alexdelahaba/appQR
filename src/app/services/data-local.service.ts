import { Injectable } from '@angular/core';
import { Registro } from '../models/registro.model';
import { Storage } from '@ionic/storage';
import { NavController } from '@ionic/angular';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { File } from '@ionic-native/file/ngx';
import { EmailComposer } from '@ionic-native/email-composer/ngx';


@Injectable({
  providedIn: 'root'
})
export class DataLocalService {

  guardados: Registro[] = [];

  constructor(private storage: Storage, private navController: NavController, private inAppBrowser: InAppBrowser, private file: File, private emailComposer: EmailComposer) {
    this.cargarStorage();

  }

  async cargarStorage() {
    this.guardados = (await this.storage.get('registros')) || [];
  }

  async guardarRegistros(format: string, text: string) {
    await this.cargarStorage();

    const nuevoRegistro = new Registro(format, text);
    this.guardados.unshift(nuevoRegistro);
    console.log(this.guardados);
    this.storage.set('registros', this.guardados);
    this.abrirRegistro(nuevoRegistro);
  }

  abrirRegistro(registro: Registro) {
    this.navController.navigateForward('/tabs/tab2');
    switch (registro.type) {
      case 'http':
        this.inAppBrowser.create(registro.text, '_system');
        break;
      case 'geo':
        this.navController.navigateForward(`/tabs/tab2/mapa/${registro.text}`);
        break;
    }
  }

  enviarCorreo() {
    const arrayTemp = [];
    const titulos = 'Tipo, Formato, Creado en, Texto\n';
    arrayTemp.push(titulos);

    this.guardados.forEach(registro => {
      const linea = `${registro.type},${registro.format},${registro.created},${registro.text.replace(',', ' ')}\n`;
      arrayTemp.push(linea);
    });

    this.creaArchivoFisico(arrayTemp.join(' '));
  }


  async escribirEnArchivo(text: string) {
    const archivo = `${this.file.dataDirectory}registros.csv`;
    await this.file.writeExistingFile(this.file.dataDirectory, 'registros.csv', text);

    // Enviar email/
    const email = {
      to: 'alexmdelahaba@hotmail.com',
      attachments: [
        archivo
      ],
      subject: 'Backup',
      body: 'Guardado de seguridad',
      isHtml: true
    };

    this.emailComposer.open(email);
  }


  creaArchivoFisico(text: string) {
    this.file.checkFile(this.file.dataDirectory, 'registros.csv').then(existe => {
      return this.escribirEnArchivo(text);
    }).catch(err => {
      return this.file.createFile(this.file.dataDirectory, 'registros.csv', false).then(creado => {
        this.escribirEnArchivo(text);
      }).catch(err2 => {
        console.log('No se pudo crear el archivo');
      });
    });
  }

}
