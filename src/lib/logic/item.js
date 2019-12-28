const _ = require('lodash');

class LogicItem
{
    constructor(scope, kind, naming)
    {
        this._scope = scope;
        this._kind = kind;
        this._naming = naming;
        this._rn = LogicItem._makeRn(kind, naming);
        this._config = {};
        this._parent = null;
        this._order = 100;
        this._children = {};
        this._properties = {};
        this._alerts = {};
    }

    get kind() {
        return this._kind;
    }

    get naming() {
        return this._naming;
    }
    
    get rn() {
        return this._rn;
    }
    
    get config() {
        return this._config;
    }

    get parent() {
        return this._parent;
    }

    get dn() {
        if (!this.parent) {
            return this.rn;
        }
        return this.parent.dn + '/' + this.rn;
    }

    get order() {
        return this._order;
    }

    set order(value) {
        this._order = value;
    }

    setConfig(value) 
    {
        this._config = value;
    }    

    getChildren() {
        return _.values(this._children);
    }

    getChildrenByKind(kind) {
        return _.values(this._children).filter(x => x.kind == kind);
    }

    addChild(child) {
        if (child._parent) {
            child._parent.removeChild(child);
        }
        child._parent = this;
        this._children[child.rn] = child;
        this._scope._acceptItem(child);
    }

    removeChild(child) {
        var x = this._children[child.rn];
        if (x) {
            this._scope._dropItem(this);
            delete this._children[child.rn];
            x._parent = null;
        }
        child._parent = null;
    }

    findByNaming(kind, naming)
    {
        var rn = LogicItem._makeRn(kind, naming);
        return this.findByRn(rn);
    }

    findByRn(rn)
    {
        var child = this._children[rn];
        if (child) {
            return child;
        }
        return null;
    }

    fetchByNaming(kind, naming)
    {
        var rn = LogicItem._makeRn(kind, naming);
        var child = this._children[rn];
        if (child) {
            return child;
        }
        child = new LogicItem(this._scope, kind, naming);
        this.addChild(child);
        return child;
    }

    addProperties(params)
    {
        if (!params) {
            params.order = 10;
        }
        this._properties[params.id] = params;
    }

    addAlert(kind, severity, date, msg)
    {
        var id = kind;
        if (date) {
            id += '-' + date;
        }

        var info = {
            id: id,
            severity: severity,
            msg: msg
        }
        if (date) {
            info.date = date;
        }
        
        this._alerts[id] = info;
    }

    extractProperties() {
        return _.values(this._properties);
    }

    extractAlerts() {
        return _.values(this._alerts);
    }

    debugOutputToFile(writer, options)
    {
        writer.write('-) ' + this.dn);
       
        writer.indent();

        writer.write('Order: ' + this.order);
        // writer.write('RN: ' + this.rn);
     
        if (options && options.includeConfig) {
            if (this.config && (_.keys(this.config).length > 0))
            {
                writer.write('Config:');
                writer.indent();
                writer.write(this.config);
                writer.unindent();
            }
        }

        writer.unindent();

        for(var child of this.getChildren())
        {
            child.debugOutputToFile(writer, options);
        }
    }

    exportTree()
    {
        var node = {};
        node.rn = this.rn;
        node.name = this.naming;
        node.id = this.dn;
        node.kind = this.kind;
        node.order = this.order;
        node.children = [];
        for(var child of this.getChildren())
        {
            node.children.push(child.exportTree());
        }
        return node;
    }

    static constructTop(scope) {
        return new LogicItem(scope, "root");
    }

    static _makeRn(kind, naming) {
        if (naming && naming.length > 0)  {
            return [kind, naming].join('-');
        }
        return kind;
    }
}

module.exports = LogicItem;