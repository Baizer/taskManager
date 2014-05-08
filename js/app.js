$(function () {
//-----------------
//-----------------
//-----------------
  var App = new Backbone.Marionette.Application();

  App.addRegions({
    headerRegion: '#headerRegion',
    inputRegion: '#inputRegion',
    listRegion: '#listRegion',
    footerRegion: '#footerRegion'
  });
//-----------------
//-----------------
//-----------------
  var Task = Backbone.Model.extend({
    defaults: {
      time: '',
      text: '',
      done: false
    },

    isDone: function () {
      return this.get('done');
    },

    switchToggle: function () {
      return this.set('done', !this.isDone());
    },

    setProp: function (prop) {
      return this.set(prop);
    }
  });

  var Tasks = Backbone.Collection.extend({
    model: Task,

    localStorage: new Backbone.LocalStorage('Tasks'),

    removeCollection: function(){
      localStorage.clear();     
      this.reset();
    }
  });

  var tasks = new Tasks;
//-----------------
//-----------------
//-----------------
  var HeaderView = Backbone.Marionette.ItemView.extend({
    template: '#headerTemplate',

    tagName: 'ul',

    className: 'button-group round inlBlock',

    events: {
      'click .navigateBtn': 'navigateTo'
    },

    navigateTo: function (e) {
      e.preventDefault();
      var url = $(e.currentTarget).attr('href');

      Backbone.history.navigate(url, true);
    }
  });

  var headerView = new HeaderView;

  var FooterView = Backbone.Marionette.ItemView.extend({
    template: '#footerTemplate',

    events: {
      'click .clearBtn': 'clearTasks'
    },

    clearTasks: function () {
      tasks.removeCollection();
    }
  });

  var footerView = new FooterView;

  var InputView = Backbone.Marionette.ItemView.extend({
    ui: {
      input: '#taskText',
      date: '#taskDate',
      error: '#taskTextColumn',
      info: '#info'
    },

    template: '#inputTemplate',

    events: {
      'keypress #taskText': 'createTask',
      'keypress #taskDate': 'createoTask'
    },

    onShow: function () {
    if(!localStorage.getItem('info')){
        this.ui.info.show();
        localStorage.setItem('info',true);
    }

      this.ui.date.fdatetimepicker();
    },

    onBeforeClose: function () {
      this.ui.date.removeData();
    },

    createTask: function (e) {
      var text = this.ui.input.val().trim(),
          now = new Date(),
          date = this.ui.date.val().trim() || "Не знаю когда";

      this.ui.error.removeClass('error');
      this.ui.info.hide(300);

      if (e.keyCode === 13) {
        if (text) {
          tasks.create({
            text: text,
            time: date
          });
          this.ui.input.val('');
          this.ui.date.val('');
        } else {
          this.ui.error.addClass('error');
        }
      }

      if (e.keyCode === 27) {
        this.ui.input.val('');
        this.ui.date.val('');
      }
    }
  });

  var inputView = new InputView;

  var TaskView = Backbone.Marionette.ItemView.extend({
    template: '#taskTemplate',
    tagName: 'article',
    className: 'task',

    ui: {
      input: '.taskInputText',
      time: '.taskInputDate',
      datePicker: '.datePicker'
    },

    events: {
      'click .removeBtn': 'removeBtn',
      'click .doneBtn': 'switchDone',
      'dblclick .textWrapper': 'editTask',
      'click .saveBtn': 'saveChanges',
      'keydown .taskText': 'saveOrExit'
    },

    removeBtn: function () {
      this.model.destroy();
    },

    switchDone: function () {
      this.model.switchToggle().save();
      this.$el.toggleClass('done');
    },

    editTask: function (e) {
      this.ui.datePicker.fdatetimepicker();
      this.$el.addClass('editing');
      this.ui.input.focus();
    },

    onBeforeClose: function (){
      if (this.ui.datePicker.data('datetimepicker')) {
        this.ui.datePicker.data('datetimepicker').picker[0].remove();
      }
    },

    onShow: function () {
      this.listenTo(this.model, 'change', this.render);
      if (this.model.get('done')) {
        this.$el.addClass('done');
      }
    },
    
    onBeforeClose: function () {
      this.model.stopListening();
    },

    saveChanges: function (e) {
      var taskText = this.ui.input.val().trim(),
          taskTime = this.ui.time.val().trim();

      if (taskText) {
        this.model.setProp({
          time: taskTime,
          text: taskText
        }).save();
        this.$el.removeClass('editing');
      } else {
        this.model.destroy();
      }

    },

    saveOrExit: function (e) {
      if (e.keyCode === 13) {
        this.saveChanges();
        return;
      }

      if (e.keyCode === 27) {
        this.ui.input.val(this.model.get('text'));
        this.$el.removeClass('editing');
      }
    }
  });

  var TaskListView = Backbone.Marionette.CollectionView.extend({
    collection: tasks,

    itemView: TaskView,

    className: 'large-8 large-centered columns'
  });

  var listView = new TaskListView;
//-----------------
//-----------------
//-----------------
  var Router = Backbone.Marionette.AppRouter.extend({
    appRoutes: {
      '*tasksType': 'showTasks',
    },

    controller: {
      showTasks: function (tasksType) {
        tasksType = tasksType || 'allTasks';
        $('#content').attr('class', tasksType);
        App.headerRegion.show(headerView);
        App.inputRegion.show(inputView);
        App.listRegion.show(listView);
        App.footerRegion.show(footerView);
      }
    }
  });

  App.addInitializer(function () {
    tasks.fetch({
      async: false
    });
    new Router();
    Backbone.history.start({
      pushState: true
    });
  });

  App.start();
});