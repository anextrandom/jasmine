describe("TrivialNodeReporter", function() {
  

  //keep these literal.  otherwise the test loses value as a test.
  function green(str)  { return '\033[32m' + str + '\033[0m'; }
  function red(str)    { return '\033[31m' + str + '\033[0m'; }
  function yellow(str) { return '\033[33m' + str + '\033[0m'; }
  
  function prefixGreen(str)  { return '\033[32m' + str; }
  function prefixRed(str)    { return '\033[31m' + str; }
  
  var newline = "\n";
  
  var passingSpec = { results: function(){ return {passed:function(){return true;}}; } },
      failingSpec = { results: function(){ return {passed:function(){return false;}}; } },
      skippedSpec = { results: function(){ return {skipped:true}; } },
      passingRun =  { results: function(){ return {failedCount: 0}; } },
      failingRun =  { results: function(){ return {failedCount: 7}; } };
  
  function repeatedlyInvoke(f, times) { for(var i=0; i<times; i++) f(times+1); }
  
  function repeat(thing, times) {
    var arr = [];
    for(var i=0; i<times; i++) arr.push(thing);
    return arr;
  }
  
  var fiftyRedFs = repeat(red("F"), 50).join(""),
      fiftyGreenDots = repeat(green("."), 50).join("");
  
  beforeEach(function() {
    this.fakeSys = (function(){
      var output = "";
      return {
        puts:function(str) {output += str + "\n";},
        print:function(str) {output += str;},
        getOutput:function(){return output;},
        clear: function(){output = "";}
      };
    })();

    this.reporter = new jasmine.TrivialNodeReporter(this.fakeSys);
  });
  
  
  describe('A Test Run', function(){

    describe('Starts', function(){
      it("prints Started", function(){
        this.reporter.reportRunnerStarting();

        expect(this.fakeSys.getOutput()).toEqual(
          "Started" + newline
        );
      });
    });
    
    describe('A spec runs', function(){
      it("prints a green dot if the spec passes", function(){
        this.reporter.reportSpecResults(passingSpec);

        expect(this.fakeSys.getOutput()).toEqual(
          green(".")
        );
      });
    
      it("prints a red dot if the spec fails", function(){
        this.reporter.reportSpecResults(failingSpec);

        expect(this.fakeSys.getOutput()).toEqual(
          red("F")
        );
      });

      it("prints a yellow star if the spec was skipped", function(){
        this.reporter.reportSpecResults(skippedSpec);

        expect(this.fakeSys.getOutput()).toEqual(
          yellow("*")
        );
      });
    });
    
    
    describe('Many specs run', function(){
      it("starts a new line every 50 specs", function(){
        var self = this;
        repeatedlyInvoke(function(){self.reporter.reportSpecResults(failingSpec);}, 49);

        expect(this.fakeSys.getOutput()).
          toEqual(repeat(red("F"), 49).join(""));
        
        repeatedlyInvoke(function(){self.reporter.reportSpecResults(failingSpec);}, 3);
        
        expect(this.fakeSys.getOutput()).
          toEqual(fiftyRedFs + newline + 
                  red("F") + red("F"));
          
        repeatedlyInvoke(function(){self.reporter.reportSpecResults(failingSpec);}, 48);
        repeatedlyInvoke(function(){self.reporter.reportSpecResults(passingSpec);}, 2);
        
        expect(this.fakeSys.getOutput()).
          toEqual(fiftyRedFs + newline + 
                  fiftyRedFs + newline + 
                  green(".") + green("."));
      });      
    });
    
    describe('A suite runs', function(){
      it("remembers suite results", function(){
        var emptyResults = function(){return {items_:[]};};
        this.reporter.reportSuiteResults({description:"Oven", results:emptyResults})
        this.reporter.reportSuiteResults({description:"Mixer", results:emptyResults})
        
        var self = this
        var descriptions = []
        for(var i=0; i<self.reporter.suiteResults.length; i++) 
          descriptions.push(self.reporter.suiteResults[i].description)
        
        expect(descriptions).toEqual(["Oven", "Mixer"])
      });      

      it("creates a description out of the current suite and any parent suites", function(){
        var emptyResults = function(){return {items_:[]};};
        var grandparentSuite = {description:"My house", results:emptyResults}
        var parentSuite = {description:"kitchen", parentSuite: grandparentSuite, results:emptyResults}
        this.reporter.reportSuiteResults({description:"oven", parentSuite: parentSuite, results:emptyResults})
        
        expect(this.reporter.suiteResults[0].description).toEqual("My house kitchen oven")
      });

      it("gathers failing spec results from the suite.  the spec must have a description.", function(){
        this.reporter.reportSuiteResults({description:"Oven", 
                                          results:function(){
                                            return {
                                              items_:[
                                                {failedCount:0, description:"specOne"},
                                                {failedCount:99, description:"specTwo"},
                                                {failedCount:0, description:"specThree"},
                                                {failedCount:88, description:"specFour"},
                                                {failedCount:3}
                                              ]
                                            }
                                          }})

        expect(this.reporter.suiteResults[0].failedSpecResults).
          toEqual([
            {failedCount:99, description:"specTwo"},
            {failedCount:88, description:"specFour"}
          ])
      });      
      
    });
    
    describe('Finishes', function(){
      it("prints Finished in green if the test run succeeded", function(){
        this.reporter.reportRunnerResults(passingRun);

        expect(this.fakeSys.getOutput()).toContain(
          newline + prefixGreen("Finished")
        );
      });

      it("prints Finished in red if the test run failed", function(){
        this.reporter.reportRunnerResults(failingRun);

        expect(this.fakeSys.getOutput()).toContain(
          newline + prefixRed("Finished")
        );
      });
      
      it("prints the elapsed time in the summary message", function(){
        this.reporter.now = function(){return 1000;};
        this.reporter.reportRunnerStarting();
        this.reporter.now = function(){return 1777;};
        this.reporter.reportRunnerResults(passingRun);
        expect(this.fakeSys.getOutput()).toContain("0.777 seconds");
      });
      
      it("prints round time numbers correctly", function(){
        var self = this;
        function run(startTime, endTime) {
          self.fakeSys.clear();
          self.reporter.runnerStartTime = startTime;
          self.reporter.now = function(){return endTime;};
          self.reporter.reportRunnerResults(passingRun);          
        }
        
        run(1000, 11000);
        expect(this.fakeSys.getOutput()).toContain("10 seconds");
        
        run(1000, 2000);
        expect(this.fakeSys.getOutput()).toContain("1 seconds");
        
        run(1000, 1100);
        expect(this.fakeSys.getOutput()).toContain("0.1 seconds");

        run(1000, 1010);
        expect(this.fakeSys.getOutput()).toContain("0.01 seconds");

        run(1000, 1001);        
        expect(this.fakeSys.getOutput()).toContain("0.001 seconds");
      });

      it("altogether now", function(){
        this.reporter.now = function(){return 1000;};
        this.reporter.reportRunnerStarting();
        this.reporter.now = function(){return 1777;};
        this.reporter.reportRunnerResults(failingRun);
        expect(this.fakeSys.getOutput()).toContain(red("Finished in 0.777 seconds"));
      });
      
    });

  });
  
});