interface ICommentData {
  id: number
  tid: number
  uid: number
  created: string
  body: string
  image: string
  imageUrl: string
  thumbnailUrl: string
  username: string

}

interface IComment extends ICommentData {

}

class Comment implements IComment {
  image:string;
  thumbnailUrl:string;
  id: number;
  tid: number;
  uid: number;
  created: string;
  body: string;
  imageUrl: string;
  username: string

  constructor(data: ICommentData) {
    for (var key in data) {
      this[key] = data[key];
    }
  }
}
