const rl = require('readline')
const fs = require('fs')
const inquirer = require("inquirer");


const questions = [
  {
    type: 'input',
    name: 'address',
    message: "Please type/paste the path for the file containing the addresses: ",
  },
  {
    type: 'input',
    name: 'names',
    message: "Please type/paste the path for the file containing the names:  ",
  }
];

inquirer.prompt(questions).then( async (answers) => {
    const addresses = await readFileContents(answers.address)
    const names = await readFileContents(answers.names)
    
    const scores = getScores(addresses, names).sort((prev, current) => prev.SS-current.SS)
    console.log("This are driver assignments per address: ")
    console.log(getSolution(scores, addresses, names))
});


/* this functions gets the highest SS value for the given street and in the given array of scores */
const findHighestValue = (scores, street) => {
    const streetval = scores.filter(item => item.street === street).reduce(function(prev, current) {
        return (prev.SS > current.SS) ? prev : current
    })
    return streetval
}
/* this function will assign a driver to a destination, by checking the best SS for each driver against each street*/
const getSolution = (scores) => {
    let scoreDump = [...scores]
    const streets = Array.from(new Set(scores.map((item) => item.street)))
    const drivers = Array.from(new Set(scores.map((item) => item.driver)))
    
    let i = 0
    const solution = []
    while (streets.length > 0) {
        const streetval = findHighestValue(scoreDump, streets[0])
            solution.push({ "street": streetval.street, "driver": streetval.driver, "SS": streetval.SS})
            scoreDump = scoreDump.filter(item => item.driver !== streetval.driver)
            scoreDump = scoreDump.filter(item => item.street !== streetval.street)
            streets.splice(0,1)
            drivers.splice(drivers.indexOf(streetval.driver),1)
    }
    return solution
}

/* 
    function to return the highest common factor, if the result is one then it means 1 is the only common factor
*/
function commonFactor(k, n) {
    return k ? commonFactor(n % k, k) : n;
}

const isEven = (streetName) => {
    return streetName.length % 2 === 0
}

/* this function calculate the value for the given streen name and drive name */
const getSSValue = (factor, vowelCount, consonantCount, streetName) => {
    let ss = 0
    if (factor === 1) {
        if (isEven(streetName)) {
            ss = 1.5*vowelCount
        } else {
            ss = consonantCount
        }
    } else {
        if (isEven(streetName)) {
            const base = 1.5 * vowelCount
            ss = (base) + (base/2)
        } else {
            const base = consonantCount
            ss = (base) + (base/2)
        } 
    }
    return ss
}

/* this function returns the scores for every combination of street and drive */
const getScores = (addresses, names) => {
    const scores = []
    for (const address of addresses) {
        const street = address.split(",")[0]
        // Im assuming the street name should just be the name without the numbers, thats why on the following line
        // im removing the numbers on the street as well as the blank spaces to get the actual number of characters
        const streetName = street.replaceAll(" ", "").replace(/[0-9]/g, '');
        for (const name of names) {
            const cleanName = name.trim()
            const cf = commonFactor(streetName.length, cleanName.trim().length)
            
            let vowelCount = cleanName.toLowerCase().match(/[aeiou]/gi).length
            let consonantCount = cleanName.split('').filter(e => e.match(/[^aeiou]/) != null).length;
            
            let score = {
                "street": streetName,
                "driver": name,
                "SS": getSSValue(cf, vowelCount, consonantCount, streetName)
            }
            scores.push(score)
        }
    }
    return scores
}


/* this functions read the contents of the given files and returns it as an array */
const readFileContents = (filePath) => {
    return new Promise(function(resolve, reject) {
        const fileStream = fs.createReadStream(filePath);
        const fileLines = rl.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        const data = []
        fileLines.on('line', (line) => {
            data.push(line)
        });

        fileLines.on('close', () => {
            resolve(data)
        });  
    });
}
