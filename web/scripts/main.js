window.onload = async () => {
  document.getElementById("page-visit-count").innerHTML = await getPageVisitCountFromLambda();
  console.log("Updated page visit count");
};

const pageVisitCountName = "pageVisitCount";

const getPageVisitCountFromLambda = async () => {
  try {
    const url = "https://api.aburke.tech/pagecount";
    const response = await fetch(url);

    const json = await response.json();
    const data = JSON.parse(json);

    return data.body.count;
  } catch (error) {
    console.error("Error getPageVisitCountFromLambda:", error);
    console.log("Falling back to local storage");

    return getPageVisitCount();
  }
};

// Local storage access only
const getPageVisitCount = () => {
  setPageVisitCountIfNotExists();
  updatePageVisitCount();

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(localStorage.getItem(pageVisitCountName));
      } catch (error) {
        console.error("Error getPageVisitCount:", error);
        reject(error);
      }
    }, 200);
  });
};

const setPageVisitCountIfNotExists = () => {
  if (localStorage.getItem(pageVisitCountName) === null) {
    localStorage.setItem(pageVisitCountName, 0);
  }
};

const updatePageVisitCount = () => {
  try {
    const pageVisitCount = parseInt(localStorage.getItem(pageVisitCountName)) + 1;
    localStorage.setItem(pageVisitCountName, pageVisitCount);
  } catch (error) {
    console.error("Error updatePageVisitCount:", error);
  }
};

const exportToWordDoc = (contentToBeExported, filename) => {
  const webAddress = window.location.origin;
  console.log("webAddress:", webAddress);
  const preHtml =
    "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>" +
    "<head>" +
    "<meta charset='utf-8'>" +
    '<link rel="stylesheet" href="[webAddress]/web/styles/body.css">'.replace("[webAddress]", webAddress) +
    '<link rel="stylesheet" href="[webAddress]/web/styles/heading.css">'.replace("[webAddress]", webAddress) +
    '<link rel="stylesheet" href="[webAddress]/web/styles/global.css">'.replace("[webAddress]", webAddress) +
    '<link rel="stylesheet" href="[webAddress]/web/styles/summary.css">'.replace("[webAddress]", webAddress) +
    '<link rel="stylesheet" href="[webAddress]/web/styles/skills.css">'.replace("[webAddress]", webAddress) +
    '<link rel="stylesheet" href="[webAddress]/web/styles/exp.css">'.replace("[webAddress]", webAddress) +
    '<link rel="stylesheet" href="[webAddress]/web/styles/edu.css">'.replace("[webAddress]", webAddress) +
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.1/css/all.min.css">' +
    "<title>Resume - Andre Burke</title>" +
    "</head>";
  const postHtml = "</html>";
  const html = preHtml + document.getElementById(contentToBeExported).innerHTML + postHtml;
  const url = "data:application/vnd.ms-word;charset=utf-8," + encodeURIComponent(html);

  const downloadLink = document.createElement("a");

  document.body.appendChild(downloadLink);

  if (navigator.msSaveOrOpenBlob) {
    const blob = new Blob(["\ufeff", html], {
      type: "application/msword",
    });
    navigator.msSaveOrOpenBlob(blob, filename);
  } else {
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.click();
  }

  document.body.removeChild(downloadLink);
};
