const CommitList = [];
const BranchList = [];

const Colors = ["#cbf", "#bdf", "#fac", "#e7d", "#957"];

const MixColors = ["#abf", "#2df", "#dac", "#b7d", "#c57"];

// @TODO - currently this works because each Branch only
// tracks those commits that are relatively unique to it.
// branches that are based on a given branch implicitly contain
// the commits of the base branch, but these are not mentioned
// in the child branch's commit list
// what happens when two branches have the same pointer?
// in this set-up, they would both have the exact same commit list

class Commit {
  constructor(key) {
    var existing = Commit.find(key);

    if (!existing) {
      this.key = key;
      this.branches = [];

      Commit.addCommit(this);
    } else {
      return existing;
    }
  }

  get sha() {
    return this.key;
  }
  set sha(val) {
    return false;
  }

  addBranch(b) {
    this.branches.push(b);
  }

  get color() {
    if (this.branches.length === 1) {
      console.log("branch color:", this.branches[0].color);
      return this.branches[0].color;
    } else {
      return MixColors[this.branches.length];
    }
  }

  get html() {
    return this.htmlNode;
  }
  set html(node) {
    this.htmlNode = node;
  }

  get offset() {
    // offset is a factor of how many branches "deep" it is,
    // which we can infer based on how many branches it belongs to that have a base commit
    var offsetCount = 0;
    for (var i = 0; i < this.branches.length; i++) {
      var b = this.branches[i];
      if (b.baseCommit) {
        offsetCount++;
      }
    }
    return offsetCount * 20;
  }

  static get CommitList() {
    return CommitList;
  }

  static find(sha) {
    for (var i = 0; i < CommitList.length; i++) {
      let c = CommitList[i];
      if (c.sha == sha) {
        return c;
      }
    }
  }

  static addCommit(commit) {
    CommitList.push(commit);
  }
}

class Branch {
  constructor(name, baseCommit, commits) {
    this.name = name;
    this.baseCommit = baseCommit;
    this.commits = commits;
    this.attempted = 0;
    this.color = Branch.selectColor();
    Branch.addBranch(this);
    _.each(this.commits, c => {
      c.addBranch(this);
    });
  }

  get offset() {
    return this.commits[0].offset + 50;
  }

  addCommit(sha) {
    this.commits.push(sha);
  }

  get html() {
    return this.htmlNode;
  }
  set html(node) {
    this.htmlNode = node;
  }
  static get BranchList() {
    return BranchList;
  }
  static addBranch(branch) {
    BranchList.push(branch);
  }

  static get color() {
    if (this.colorIndex === undefined) {
      this.colorIndex = -1;
    }
    return this.colorIndex;
  }
  static set color(i) {
    this.colorIndex = i;
  }
  static selectColor() {
    this.color = this.color + 1;
    return Colors[this.color];
  }

}

var b1 = new Branch("master", undefined, [new Commit("a123"), new Commit("a456"), new Commit("a789")]);

var b3 = new Branch("feature_2", b1.commits[1], [new Commit("c123"), new Commit("c456")]);
/*
var shared = [ new Commit("b123"), new Commit("b456"), ] 
var b4 = new Branch("feature_3", b3.commits[1], shared);
var b2 = new Branch("feature_1", b3.commits[1], shared);
*/

var b4 = new Branch("feature_3", b3.commits[1], [new Commit("d123"), new Commit("d456")]);

var b2 = new Branch("feature_1", b3.commits[1], [new Commit("b123"), new Commit("b456")]);

var branches = [b4, b2, b1, b3];

renderBranches(branches);

function renderBranches(branches) {
  var network = document.getElementById("network");

  for (var i = 0; i < branches.length; i++) {
    var b = branches[i];
    if (b.attempted > branches.length * branches.length) {// if have tried all combinations
      // no-op
    } else {
        var branchEl;
        if (b.html) {
          branchEl = b.html;
        } else {
          branchEl = createBranchNode(b);
          b.html = branchEl;
        }

        var commitList = document.createElement('div');
        commitList.setAttribute("id", "branch_" + b.name + "_commits");
        commitList.className = "branch_" + b.name + "_commits";
        commitList.setAttribute("draggable", "true");

        //branchEl.appendChild(commitList);

        _.each(b.commits, c => {
          var commitEl;
          if (c.html) {
            commitEl = c.html;
          } else {
            commitEl = createCommitNode(c);
            c.html = commitEl;
          }
          commitList.appendChild(commitEl);
        });

        var dest;
        if (!b.baseCommit) {
          dest = network;
        } else {
          var destCommit = document.getElementById("commit_" + b.baseCommit.sha);
          if (destCommit) {
            var destChildList = document.getElementById("commit_" + b.baseCommit.sha + "_child_branches");
            if (!destChildList) {
              destChildList = document.createElement("div");
              destChildList.setAttribute("id", "commit_" + b.baseCommit.sha + "_child_branches");
              destChildList.className = "commit_" + b.baseCommit.sha + "_child_branches";
              destCommit.appendChild(destChildList);
            }
            dest = destChildList;
          } else {
            console.log("no dest commit", b.name);
            dest = false;
          }
        }

        if (dest) {
          dest.appendChild(branchEl);
          dest.appendChild(commitList);
        } else {
          // branches may be out of order, allow to try again
          b.attempted++;
          branches.push(b);
        }
      }
  }

  function createBranchNode(branch) {
    var branchEl = document.createElement("div");
    branchEl.setAttribute("id", "branch_" + branch.name);

    var style = "position:relative; left:" + branch.offset + "px;";
    branchEl.setAttribute("style", style);
    branchEl.className = 'branch';

    var branchName = document.createElement('div');
    branchName.className = 'branch-name';
    style = "background-color:" + branch.color + ";";
    branchName.setAttribute('style', style);
    var text = document.createTextNode(branch.name);

    branchName.appendChild(text);
    branchEl.appendChild(branchName);

    return branchEl;
  }

  function createCommitNode(commit) {
    var commitEl = document.createElement('div');
    commitEl.setAttribute("id", "commit_" + commit.sha);
    var point = document.createElement('div');
    point.className = 'commit-point';
    point.setAttribute("id", "commit_point_" + commit.sha);

    var style = "background-color:" + commit.color + ";";
    point.setAttribute("style", style);

    var sha = document.createElement('div');
    sha.className = 'sha';
    var shaText = document.createTextNode(commit.sha);
    sha.appendChild(shaText);
    point.appendChild(sha);
    commitEl.appendChild(point);

    commitEl.className = "commit";
    style = "left:" + commit.offset + "px;";
    commitEl.setAttribute("style", style);

    return commitEl;
  }
}

drawConnections(CommitList);

function drawConnections(commits) {
  console.log(commits);
  for (var i = 0; i < commits.length; i++) {
    let c = commits[i];
    console.log("commit:", c);
    for (var j = 0; j < c.branches.length; j++) {
      let b = c.branches[j];
      let nextCommit = undefined;
      for (var k = 0; k < b.commits.length; k++) {
        let cc = b.commits[k];
        if (cc.sha === c.sha) {
          nextCommit = b.commits[k + 1];
        }
      }

      if (nextCommit) {
        console.log("**** next commit:", nextCommit.sha);
        let link = document.createElement('div');
        link.className = 'link';
        link.setAttribute('style', 'background-color:' + c.color);
        c.html.appendChild(link);
      } else {
        var pointer = document.createElement("div");
        pointer.setAttribute('class', 'pointer_' + c.sha);
        var branchName = document.createElement('div');
        var text = document.createTextNode(b.name);
        pointer.appendChild(text);

        var childBranchElem = c.html.querySelector("[id*='child_branches']");
        if (childBranchElem) {
          c.html.insertBefore(pointer, childBranchElem);
        } else {
          c.html.appendChild(pointer);
        }
      }
    }
    console.log("----------------------");
  }
}

createRebaseEvents();

function createRebaseEvents() {
  // want a drag event on each branch
  // it should allow the branch to be rebased onto a
  // different commit.

  // use dragstart and dragend to determine where the
  // dragover and dragleave (the actor is the dragged item)
  // or drop or dragenter and dragexist (the actor is the drop location, i.e. the commit -- this one seems more likely to be useful), since we can grab the commit that the branch is being dropped onto to get the relevant commit information

  // can also use the "drag" event to do things while the branch is being dragged, such as an animation

  var $childBranches = $("[class*=_child_branches] [class*=_commits]");

  $childBranches.on('dragstart', function (e) {
    e.stopPropagation();
    //console.log("start:", e)
    e.originalEvent.dataTransfer.setData('text/plain', this.getAttribute('id'));
    //console.log("dragging:", e)
    //console.log(e.y, "x", e.x)
    //e.preventDefault();
  });
  $childBranches.on('drag', function (e) {
    e.stopPropagation();
    //console.log("d", d);
    //console.log(e)
    //console.log(e.y, "x", e.x)
  });

  var $commits = $(".commit-point");
  $commits.on("dragover", function (e) {
    e.preventDefault();
    //console.log("dragged onto:", this)
    //console.log(e);

    e.originalEvent.dataTransfer.dropEffect = 'move';
  });
  $commits.on('drop', function (e) {
    e.preventDefault();
    var branchElemId = e.originalEvent.dataTransfer.getData('text/plain');
    console.log("branch id:", branchElemId);
    var branchElem = document.getElementById(branchElemId);
    console.log("branch:", branchElem);
    console.log("Dest:", this);
    var destCommitId = this.getAttribute('id').split("commit_point_")[1];
    console.log("dest commit id:", destCommitId);
    console.log("dest elem:", this);
    var childBranchContainer = document.getElementById("commit_" + destCommitId);
    console.log("child branch container:", childBranchContainer);
    if (!childBranchContainer) {
      childBranchContainer = document.createElement("div");
      childBranchContainer.setAttribute('id', 'commit_' + destCommitId + '_child_branches');
      childBranchContainer.className = 'commit_' + destCommitId + '_child_branches';
      this.appendChild(childBranchContainer);
    }

    childBranchContainer.appendChild(branchElem);

    var branchName = branchElemId.split("branch_")[1];
    branchName = branchName.split("_commits")[0];

    // if the dest commit is the last commit
    // in it's branch, then the command
    // will be rebasing onto that branch
    // name; otherwise it's the commit
    var gitContainer = document.createElement("div");
    var gitCommand = "git rebase " + branchName + " --onto " + destCommitId;
    var gitText = document.createTextNode(gitCommand);
    gitContainer.appendChild(gitText);

    document.getElementById("git_command").appendChild(gitContainer);
  });
}

// @TODO - so far the moving doesn't behave like git actually behaves
// if you rebase a branch that has other branches off of it, the branch is rebased, but the remaining "orphaned" branches stay as they are, with the original commits where they were. the rebased branch COPIES it's commits over to the destination;
// so I need to handle that scenario
//# sourceMappingURL=index.js.map