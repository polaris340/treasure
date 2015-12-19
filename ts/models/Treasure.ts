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
  liked: boolean
  imageUrl: string
  latitude: number
  longitude: number
  name: string
  qrcodeUrl: string
  type: string
  difficulty: number

}

// methods
interface ITreasure extends ITreasureData {
  setMarkerIcon(selected:boolean): void
  update(data: ITreasureData): void
}

class Treasure implements ITreasure {

  id: number;
  address: string;
  description: string;
  era: string;
  liked:boolean;
  explored: boolean;
  imageUrl: string;
  private mLatitude: number;
  private mLongitude: number;
  name: string;
  qrcodeUrl: string;
  type: string;
  difficulty:number;

  _marker: any;

  constructor (treasureData: ITreasureData) {
    this.id = treasureData.id;
    for (var key in treasureData) {
      var val = treasureData[key];
      if (val === 'true') {
        val = true;
      }
      if (val === 'false') {
        val = false;
      }
      this[key] =  val;
    }
  }

  get marker() {
    if (!this._marker) {
      //var icon = 'img/icon/ic_marker_default.png';
      //if (this.explored) {
      //  icon = 'img/icon/ic_marker_found.png';
      //} else if (this.liked) {
      //  icon = 'img/icon/ic_marker_liked.png';
      //}

      var latLng = new google.maps.LatLng(this.latitude, this.longitude);
      this._marker = new google.maps.Marker({
        position: latLng,
        title: this.name
      });
      this.setMarkerIcon(false);
    }

    return this._marker;
  }

  get locationString() {
    return this.latitude + ',' + this.longitude;
  }


  setMarkerIcon(selected:boolean):void {
    var icon = 'img/icon/ic_marker_';
    if (selected) icon += 'selected_';
    var suffix = 'default';
    if (this.explored) suffix = 'found';
    else if (this.liked) suffix = 'liked';
    icon += suffix + '.png';
    this.marker.setIcon(icon);
  }

  update(data:ITreasureData) {
    for (var key in data) {
      this[key] = data[key];
    }
  }

  set latitude(value: number) {
    this.mLatitude = value;
    //if (!this.mLatitude) {
    //  this.mLatitude = value + ((Math.pow(this.id, 3) % 997 - 997) / 10000000);
    //}
  }

  get latitude() {
    return this.mLatitude;
  }

  set longitude(value: number) {
    this.mLongitude = value;
    //if (!this.mLongitude) {
    //  this.mLongitude = value + ((Math.pow(this.id, 2) % 997 - 997) / 10000000);
    //}
  }

  get longitude() {
    return this.mLongitude;
  }
}
