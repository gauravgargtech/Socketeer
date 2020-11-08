
includeCss(
  "https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css"
);
includeCss("./intercom.css");

var boxHtml = `
<div class="container">
  <div class="row">
    <div id="Smallchat">
      <div
        class="Layout Layout-open Layout-expand Layout-right"
        style="
          background-color: #3f51b5;
          color: rgb(255, 255, 255);
          opacity: 5;
          border-radius: 10px;
        "
      >
        <div class="Messenger_messenger">
          <div
            class="Messenger_header"
            style="background-color: rgb(22, 46, 98); color: rgb(255, 255, 255)"
          >
            <h4 class="Messenger_prompt">Here are voice commands for you?</h4>
            <span class="chat_close_icon"
              ><i class="fa fa-window-close" aria-hidden="true"></i
            ></span>
          </div>
          <div class="Messenger_content">
            <div class="Messages">
              <div class="Messages_list" id="messages_list"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="chat_on">
        <span class="chat_on_icon"
          ><i class="fa fa-comments" aria-hidden="true"></i>Say Hi
        </span>
      </div>
    </div>
  </div>
</div>
`;

function drawBox() {
  document.getElementsByTagName("body")[0].innerHTML += boxHtml;
}
