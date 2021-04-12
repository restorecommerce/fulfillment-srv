import * as soap from 'soap';
import { createServiceConfig } from '@restorecommerce/service-config';
import * as moment from 'moment';
import * as  request from 'request';

const cfg = createServiceConfig(process.cwd());

export const createClientDHL = async (): Promise<any> => {
  return new Promise((resolve: any, reject: any) => {
    const url = cfg.get().wsdlUrl.url;
    const username = cfg.get().SoapAuth.userName;
    const password = cfg.get().SoapAuth.password;
    soap.createClient(url, (err, client): any => {
      if (err) {
        reject(err);
      }
      if (client) {
        client.setEndpoint(cfg.get().endPoint.url);
        client.setSecurity(new soap.BasicAuthSecurity(username, password));
        client.addSoapHeader(cfg.get().wsdlHeaders);
        client.setSOAPAction('urn:createShipmentOrder');
        resolve(client);
      }
    });
  });
};

export const createShipmentDHL = async (input: any) => {
  let client = await createClientDHL();
  let creationResponse = await new Promise((resolve: any, reject: any): any => {
    client.addSoapHeaderAsync(cfg.get().wsdlHeaders);

    client.GVAPI_2_0_de.GKVAPISOAP11port0.createShipmentOrder(input,
      (err: any, result: any, rawResponse: any, rawRequest: any): any => {
        if (err) {
          reject(rawResponse);
        }
        if (result) {
          let Result = result.CreationState;
          resolve(Result);
        }
      });
  });

  return creationResponse;
};

export const validateShipmentDHL = async (input: any) => {
  let client = await createClientDHL();

  const validationResponse = await new Promise((resolve: any, reject: any): any => {
    client.GVAPI_2_0_de.GKVAPISOAP11port0.validateShipment(input,
      (err: any, result: any, rawResponse: any, rawRequest: any): any => {

        if (err) {
          reject(err);
        }

        if (result) {
          if (result.Status) { // single shipment: returns dict
            resolve([result.ValidationState]);
          } else { // multiple shipments: returns array of dict
            resolve(result.ValidationState);
          }
        }
      });
  });

  return validationResponse;
};

export const trackShipmentDHL = async (shipmentNumbers: any) => {
  const encode_shipment_numbers = shipmentNumbers;
  let ToDate: any;
  let FromDate: any;
  ToDate = moment().format('YYYY-MM-DD');
  FromDate = moment().subtract('days', 90).format('YYYY-MM-DD');
  const authUsername = cfg.get().SoapAuth.userName;
  const authpassword = cfg.get().SoapAuth.password;
  const appname = cfg.get().dhltrackingCredentials.appname;
  const apppassword = cfg.get().dhltrackingCredentials.password;
  let url = cfg.get().ProdUrl.url + ' version="1.0" encoding="UTF-8" standalone="no" ?><data appname="' + appname + '"  language-code="en"   password="' + apppassword + '"  piece-code ="' + encode_shipment_numbers + '"  from-date="' + FromDate + '"   to-date="' + ToDate + '" request="d-get-piece-detail" />';
  let auth = 'Basic ' + new Buffer('nfuseshipment_1' + ':' + 'PkU0Wm7puk4xSRAe8jsvJP2mnQOqLN').toString('base64');
  let result = await new Promise((resolve: any, reject: any) => {
    request.get({
      url,
      headers: {
        Authorization: auth
      }
    }, (err: any, response: any, body: any) => {
      if (err) {
        reject(err);
      }
      if (body) {
        resolve(body);
      }
    });
  });
  return result;
};

export const getLabelsDHL = async (labelArg: any) => {
  let client = await createClientDHL();
  const labels = await new Promise((resolve: any, reject: any): any => {
    client.GVAPI_2_0_de.GKVAPISOAP11port0.getLabel(labelArg,
      (err: any, result: any, rawResponse: any, soapHeader: any, rawRequest: any): any => {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
  });
  return labels;
};

export const deleteShipmentDHL = async (shipmentNumber: any) => {
  let client = await createClientDHL();
  const deleteStatus = await new Promise((resolve: any, reject: any) => {
    client.GVAPI_2_0_de.GKVAPISOAP11port0.deleteShipmentOrder(shipmentNumber,
      (err: any, result: any) => {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
  });
  return deleteStatus;
};
