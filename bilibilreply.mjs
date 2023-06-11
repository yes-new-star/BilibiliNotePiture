
import https from "https";
import querystring from "querystring";

const myCookie =
  ""
const reg = /(?<=bili_jct=)[0-9a-f]{32}/;

const reply_csrf = myCookie.match(reg)[0];

let at_s = 0;

function unread_req_fun() {
  return new Promise((resolve, reject) => {
    const unread_options = {
      method: "GET",
      hostname: "api.bilibili.com",
      path: "/x/msgfeed/unread?build=0&mobi_app=web",
      headers: {
        Cookie: myCookie,
      },
      withCredentials: true,
    };

    const unread_req = https.request(unread_options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        data = JSON.parse(data);
        resolve(data);
      });
    });
    unread_req.on("error", (error) => {
      // console.error("获取艾特信息错误:\n", error);
      reject(error);
    });
    unread_req.end();
  });
}

function at_req_fun(at_data) {
  return new Promise((resolve, reject) => {
    console.log("at_data:", at_data);
    const at_options = {
      method: "GET",
      hostname: "api.bilibili.com",
      path: "/x/msgfeed/at?build=0&mobi_app=web",
      headers: {
        Cookie: myCookie,
      },
      withCredentials: true,
    };

    const at_req = https.request(at_options, (res) => {
      let data = "";
      // console.log("statusCode:", res.statusCode);

      if (res.statusCode == "200") {
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          data = JSON.parse(data);
          resolve(data);
        });
      }
    });
    at_req.on("error", (error) => {
      console.error("Request error:", error);
      reject(error);
    });
    at_req.end();
  });
}

function reply_req_fun(data, at_nums) {
  for (let i = 0; i < at_nums; i++) {
    const reply_options = {
      method: "GET",
      hostname: "api.bilibili.com",
      path: `/x/v2/reply/main?csrf=${reply_csrf}&mode=3&oid=${
        data.data.items[at_nums - i - 1].item.subject_id
      }&pagination_str=%7B%22offset%22:%22%22%7D&plat=1&seek_rpid=${
        data.data.items[at_nums - i - 1].item.source_id
      }&type=1`,
      headers: {
        Cookie: myCookie,
      },
      withCredentials: true,
    };
    const reply_req = https.request(reply_options, (res) => {
      let reply_data = "";
      res.on("data", (chunk) => {
        reply_data += chunk;
      });
      res.on("end", () => {
        reply_data = JSON.parse(reply_data);

        let add_message = "";

        for (
          let j = 0;
          j < reply_data.data.seek_root_reply.content.pictures.length;
          j++
        ) {
          add_message += `图片${j + 1}地址：https: ${
            reply_data.data.seek_root_reply.content.pictures[j].img_src.split(':')[1]
          }\n`;
        }
        console.log(
          "Response body:",
          reply_data.data.seek_root_reply.content.pictures,
          reply_csrf
        );
        // 回复请求
        const datas = {
          // 该部分对象属性B站可能会经常变化，目前本人是经历过一次的
          oid: data.data.items[at_nums - i - 1].item.subject_id,
          type: 1,
          root: data.data.items[at_nums - i - 1].item.target_id,
          parent: data.data.items[at_nums - i - 1].item.source_id,
          jsonp:'jsonp',
          message: add_message,
          scene: "msg",
          plat: '1',
          from: "im-reply",
          build: '0',
          mobi_app: "web",
          csrf_token: reply_csrf,
          csrf: reply_csrf,
        };
        const postData = querystring.stringify(datas);
        const add_options = {
          method: "POST",
          hostname: "api.bilibili.com",
          path: `/x/v2/reply/add`,
          headers: {
            Cookie: myCookie,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          withCredentials: true,
        };
        const add_req = https.request(add_options, (res) => {
          console.log(res.statusCode);
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            console.log("回复请求结果：", data);
          });
        });
        add_req.on("error", (error) => {
          console.error("Request error:", error);
        });
        add_req.write(postData);
        console.log("postdata", postData);
        add_req.end();
      });
    });
    reply_req.on("error", (error) => {
      console.error("Request error:", error);
    });
    reply_req.end();
    console.log(i, data[i]);
  }
}

async function main() {
  const unread_req_data = await unread_req_fun();
  if (unread_req_data.data.at > 0) {
    at_s = unread_req_data.data.at;
    const at_req_data = await at_req_fun(unread_req_data);
    await reply_req_fun(at_req_data, at_s);
  }
  console.log('没人艾特我！');
}

main();