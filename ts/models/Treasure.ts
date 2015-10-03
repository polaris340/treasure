/*
 address: "서울 중구 세종대로 40 (남대문로4가)"
 description: "description"
 era: "조선시대"
 explored: true
 id: 1
 imageUrl: "http://cfs6.tistory.com/upload_control/download.blog?fhandle=YmxvZzEwNjMwQGZzNi50aXN0b3J5LmNvbTovYXR0YWNoLzEvMTE5LmpwZw%3D%3D"
 latitude: 37.615320754935965
 longitude: 126.57203069585375
 name: "숭례문"
 qrcodeUrl: "http://m.cha.go.kr/korea/heritage/search/Culresult_Db_View.jsp?mc=NS_04_03_01&VdkVgwKey=11,00010000,11&flag=Y#content"
 type: "국보 제1호"
 */


interface ITreasureData {
  id: number
  address: string
  description: string
  era: string
  explored: boolean
  imageUrl: string
  latitude: number
  longitude: number
  name: string
  qrcodeUrl: string
  type: string

}

// methods
interface ITreasure extends ITreasureData {

}

class Treasure implements ITreasure {
  id: number;
  address: string;
  description: string;
  era: string;
  explored: boolean;
  imageUrl: string;
  latitude: number;
  longitude: number;
  name: string;
  qrcodeUrl: string;
  type: string;

  map: any;
  _marker: any;

  constructor (treasureData: ITreasureData, map: any) {
    for (var key in treasureData) {
      this[key] = treasureData[key];
      this.map = map;
    }
  }

  get marker() {
    if (!this._marker) {
      var latLng = new google.maps.LatLng(this.latitude, this.longitude);
      this._marker = new google.maps.Marker({
        position: latLng,
        title: this.name,
        icon: this.explored ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
      });
    }

    return this._marker;
  }
}
