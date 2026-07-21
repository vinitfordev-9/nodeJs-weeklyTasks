function myMap(array, callback) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(array)) {
      reject("First argument should be an array");
    }
    if (typeof callback != "function") {
      reject("Second argument should be an function");
    }
    const result = [];
    for (let i = 0; i < array.length; i++) {
      let transfomedValue = callback(array[i]);
      result.push(transfomedValue);
    }
    resolve(result);
  });
}

const numbers = [1, 2, 3, 4];
myMap(numbers, (num) => num * 2)
  .then((data) => {
    console.log(data);
  })

  .catch((error) => {
    console.log(error);
  });
