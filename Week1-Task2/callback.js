function myMap(array, callback) {
  if (!Array.isArray(array)) {
    console.log("First argumnet should be an array");
    return;
  }
  if (typeof callback != "function") {
    console.log("The second argumnet should be a function");
    return;
  }

  let result = [];
  for (let i = 0; i < array.length; i++) {
    let transformedValue = callback(array[i]);
    result.push(transformedValue);
  }
  return result;
}

const numbers = [1, 2, 3, 4];
const answer = myMap(numbers, (num) => num + 10);
console.log(answer);
